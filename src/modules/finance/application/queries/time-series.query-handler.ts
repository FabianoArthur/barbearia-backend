import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import {
  FINANCE_ANALYTICS_REPOSITORY,
  type Granularity,
  type IFinanceAnalyticsRepository,
  type PeriodRevenue,
} from '../../domain/interfaces/finance-analytics-repository.interface';
import type { TimeSeriesMetric } from '../../presentation/dtos/time-series-query.dto';
import type { TimeSeriesResponseDto } from '../../presentation/dtos/time-series-response.dto';

const TRENDS_CACHE_TTL = 900_000; // 15 minutes

@Injectable()
export class TimeSeriesQueryHandler {
  constructor(
    @Inject(FINANCE_ANALYTICS_REPOSITORY)
    private readonly analyticsRepo: IFinanceAnalyticsRepository,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async execute(
    establishmentId: string | undefined,
    startDate: string,
    endDate: string,
    granularity: Granularity,
    metric: TimeSeriesMetric,
  ): Promise<TimeSeriesResponseDto> {
    const cacheKey = `finance:trends:${establishmentId ?? 'all'}:${startDate}:${endDate}:${granularity}:${metric}`;
    const cached = await this.cache.get<TimeSeriesResponseDto>(cacheKey);
    if (cached) return cached;

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Calculate previous period of same duration
    const duration = end.getTime() - start.getTime();
    const previousStart = new Date(start.getTime() - duration - 1);
    const previousEnd = new Date(start.getTime() - 1);

    const [currentData, previousData] = await Promise.all([
      this.analyticsRepo.getRevenueByPeriod(establishmentId, granularity, start, end),
      this.analyticsRepo.getRevenueByPeriod(
        establishmentId,
        granularity,
        previousStart,
        previousEnd,
      ),
    ]);

    // Find peak period
    const peakPeriod = this.findPeakPeriod(currentData, metric);

    // Calculate period-over-period growth rates
    const growthRates = this.calculateGrowthRates(currentData, metric);

    const result: TimeSeriesResponseDto = {
      current: currentData.map((p) => ({
        period: p.period,
        grossRevenue: p.grossRevenue,
        netRevenue: p.netRevenue,
        bookingCount: p.bookingCount,
        totalTips: p.totalTips,
        totalPlatformFees: p.totalPlatformFees,
      })),
      previous: previousData.map((p) => ({
        period: p.period,
        grossRevenue: p.grossRevenue,
        netRevenue: p.netRevenue,
        bookingCount: p.bookingCount,
        totalTips: p.totalTips,
        totalPlatformFees: p.totalPlatformFees,
      })),
      peakPeriod,
      growthRates,
      generatedAt: new Date().toISOString(),
    };

    await this.cache.set(cacheKey, result, TRENDS_CACHE_TTL);
    return result;
  }

  private findPeakPeriod(
    data: PeriodRevenue[],
    metric: TimeSeriesMetric,
  ): { period: string; value: number } | null {
    if (data.length === 0) return null;

    let maxItem = data[0];
    let maxValue = this.getMetricValue(data[0], metric);

    for (const item of data) {
      const value = this.getMetricValue(item, metric);
      if (value > maxValue) {
        maxValue = value;
        maxItem = item;
      }
    }

    return { period: maxItem.period, value: maxValue };
  }

  private calculateGrowthRates(
    data: PeriodRevenue[],
    metric: TimeSeriesMetric,
  ): { period: string; growthRate: number }[] {
    if (data.length < 2) return [];

    const rates: { period: string; growthRate: number }[] = [];
    for (let i = 1; i < data.length; i++) {
      const current = this.getMetricValue(data[i], metric);
      const previous = this.getMetricValue(data[i - 1], metric);
      const growthRate =
        previous === 0 ? (current > 0 ? 100 : 0) : ((current - previous) / previous) * 100;
      rates.push({
        period: data[i].period,
        growthRate: Math.round(growthRate * 100) / 100,
      });
    }

    return rates;
  }

  private getMetricValue(item: PeriodRevenue, metric: TimeSeriesMetric): number {
    switch (metric) {
      case 'revenue':
        return item.grossRevenue;
      case 'bookings':
        return item.bookingCount;
      case 'tips':
        return item.totalTips;
      case 'fees':
        return item.totalPlatformFees;
    }
  }
}
