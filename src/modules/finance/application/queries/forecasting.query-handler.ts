import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import {
  FINANCE_ANALYTICS_REPOSITORY,
  type Granularity,
  type IFinanceAnalyticsRepository,
  type PeriodRevenue,
} from '../../domain/interfaces/finance-analytics-repository.interface';
import type {
  AnomalyDto,
  ForecastingResponseDto,
  ForecastPointDto,
  SeasonalPatternDto,
} from '../../presentation/dtos/forecasting-response.dto';

const FORECAST_CACHE_TTL = 3_600_000; // 1 hour

@Injectable()
export class ForecastingQueryHandler {
  constructor(
    @Inject(FINANCE_ANALYTICS_REPOSITORY)
    private readonly analyticsRepo: IFinanceAnalyticsRepository,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async execute(
    establishmentId: string | undefined,
    granularity: Granularity,
    periodsAhead: number,
    lookbackPeriods: number,
  ): Promise<ForecastingResponseDto> {
    const cacheKey = `finance:forecast:${establishmentId ?? 'all'}:${granularity}:${periodsAhead}:${lookbackPeriods}`;
    const cached = await this.cache.get<ForecastingResponseDto>(cacheKey);
    if (cached) return cached;

    // Fetch historical data
    const lookbackStart = this.calculateLookbackStart(granularity, lookbackPeriods);
    const historicalData = await this.analyticsRepo.getRevenueByPeriod(
      establishmentId,
      granularity,
      lookbackStart,
      new Date(),
    );

    const revenues = historicalData.map((d) => d.grossRevenue);

    // Simple Moving Average
    const movingAverage = this.calculateMovingAverage(revenues);

    // Forecast future periods
    const forecast = this.generateForecast(historicalData, periodsAhead, granularity);

    // Anomaly detection (2 standard deviations)
    const anomalies = this.detectAnomalies(historicalData, revenues);

    // Seasonal patterns
    const seasonalPatterns = this.identifySeasonalPatterns(historicalData, granularity);

    // Trend detection
    const trend = this.detectTrend(revenues);

    const result: ForecastingResponseDto = {
      forecast,
      anomalies,
      seasonalPatterns,
      movingAverage: Math.round(movingAverage * 100) / 100,
      trend,
      generatedAt: new Date().toISOString(),
    };

    await this.cache.set(cacheKey, result, FORECAST_CACHE_TTL);
    return result;
  }

  private calculateMovingAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  private generateForecast(
    data: PeriodRevenue[],
    periodsAhead: number,
    granularity: Granularity,
  ): ForecastPointDto[] {
    if (data.length < 2) return [];

    const revenues = data.map((d) => d.grossRevenue);
    const movingAvg = this.calculateMovingAverage(revenues);

    // Simple linear regression for trend
    const slope = this.calculateSlope(revenues);
    const lastValue = revenues[revenues.length - 1];
    const lastDate = new Date(data[data.length - 1].period);

    const forecasts: ForecastPointDto[] = [];
    for (let i = 1; i <= periodsAhead; i++) {
      const predicted = lastValue + slope * i;
      const futurePeriod = this.addPeriods(lastDate, i, granularity);

      // Confidence based on data points and variance
      const variance = this.calculateVariance(revenues);
      const cv = movingAvg > 0 ? Math.sqrt(variance) / movingAvg : 1;
      const confidence: 'low' | 'medium' | 'high' =
        data.length < 6 || cv > 0.5 ? 'low' : cv > 0.25 ? 'medium' : 'high';

      forecasts.push({
        period: futurePeriod.toISOString(),
        predictedRevenue: Math.max(0, Math.round(predicted * 100) / 100),
        confidence,
      });
    }

    return forecasts;
  }

  private detectAnomalies(data: PeriodRevenue[], revenues: number[]): AnomalyDto[] {
    if (revenues.length < 4) return [];

    const mean = this.calculateMovingAverage(revenues);
    const stdDev = Math.sqrt(this.calculateVariance(revenues));
    const threshold = 2;

    const anomalies: AnomalyDto[] = [];
    for (const item of data) {
      const deviation = (item.grossRevenue - mean) / (stdDev || 1);
      if (Math.abs(deviation) > threshold) {
        anomalies.push({
          period: item.period,
          actualRevenue: item.grossRevenue,
          expectedRevenue: Math.round(mean * 100) / 100,
          deviation: Math.round(deviation * 100) / 100,
          type: deviation > 0 ? 'spike' : 'drop',
        });
      }
    }

    return anomalies;
  }

  private identifySeasonalPatterns(
    data: PeriodRevenue[],
    granularity: Granularity,
  ): SeasonalPatternDto[] {
    if (data.length < 4 || granularity === 'year') return [];

    // Group by month-of-year for monthly data, or day-of-week for daily data
    const groups = new Map<string, number[]>();

    for (const item of data) {
      const date = new Date(item.period);
      const key =
        granularity === 'day'
          ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getUTCDay()]
          : granularity === 'month'
            ? date.toLocaleString('en', { month: 'short' })
            : item.period;

      const values = groups.get(key) ?? [];
      values.push(item.grossRevenue);
      groups.set(key, values);
    }

    const overallAvg = this.calculateMovingAverage(data.map((d) => d.grossRevenue));
    const patterns: SeasonalPatternDto[] = [];

    for (const [period, values] of groups) {
      const avg = values.reduce((s, v) => s + v, 0) / values.length;
      patterns.push({
        period,
        averageRevenue: Math.round(avg * 100) / 100,
        relativeStrength: overallAvg > 0 ? Math.round((avg / overallAvg) * 100) / 100 : 0,
      });
    }

    return patterns.sort((a, b) => b.averageRevenue - a.averageRevenue);
  }

  private detectTrend(revenues: number[]): 'growing' | 'declining' | 'stable' {
    if (revenues.length < 3) return 'stable';

    const slope = this.calculateSlope(revenues);
    const mean = this.calculateMovingAverage(revenues);
    const relativeSlope = mean > 0 ? slope / mean : 0;

    if (relativeSlope > 0.02) return 'growing';
    if (relativeSlope < -0.02) return 'declining';
    return 'stable';
  }

  private calculateSlope(values: number[]): number {
    const n = values.length;
    if (n < 2) return 0;

    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;

    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += values[i];
      sumXY += i * values[i];
      sumX2 += i * i;
    }

    const denominator = n * sumX2 - sumX * sumX;
    return denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0;
  }

  private calculateVariance(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = this.calculateMovingAverage(values);
    return values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (values.length - 1);
  }

  private calculateLookbackStart(granularity: Granularity, periods: number): Date {
    const now = new Date();
    switch (granularity) {
      case 'day':
        now.setDate(now.getDate() - periods);
        break;
      case 'week':
        now.setDate(now.getDate() - periods * 7);
        break;
      case 'month':
        now.setMonth(now.getMonth() - periods);
        break;
      case 'quarter':
        now.setMonth(now.getMonth() - periods * 3);
        break;
      case 'year':
        now.setFullYear(now.getFullYear() - periods);
        break;
      default:
        now.setMonth(now.getMonth() - periods);
    }
    return now;
  }

  private addPeriods(date: Date, count: number, granularity: Granularity): Date {
    const result = new Date(date);
    switch (granularity) {
      case 'day':
        result.setDate(result.getDate() + count);
        break;
      case 'week':
        result.setDate(result.getDate() + count * 7);
        break;
      case 'month':
        result.setMonth(result.getMonth() + count);
        break;
      case 'quarter':
        result.setMonth(result.getMonth() + count * 3);
        break;
      case 'year':
        result.setFullYear(result.getFullYear() + count);
        break;
      default:
        result.setMonth(result.getMonth() + count);
    }
    return result;
  }
}
