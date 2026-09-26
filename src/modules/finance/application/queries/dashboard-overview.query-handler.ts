import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import {
  FINANCE_ANALYTICS_REPOSITORY,
  type IFinanceAnalyticsRepository,
} from '../../domain/interfaces/finance-analytics-repository.interface';
import type { DashboardPeriod } from '../../presentation/dtos/dashboard-query.dto';
import type { DashboardResponseDto } from '../../presentation/dtos/dashboard-response.dto';

const DASHBOARD_CACHE_TTL = 120_000; // 2 minutes

@Injectable()
export class DashboardOverviewQueryHandler {
  private readonly logger = new Logger(DashboardOverviewQueryHandler.name);

  constructor(
    @Inject(FINANCE_ANALYTICS_REPOSITORY)
    private readonly analyticsRepo: IFinanceAnalyticsRepository,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async execute(
    establishmentId: string | undefined,
    period: DashboardPeriod,
    comparePrevious: boolean,
  ): Promise<DashboardResponseDto> {
    const cacheKey = `finance:dashboard:${establishmentId ?? 'all'}:${period}:${comparePrevious}`;

    try {
      const cached = await this.cache.get<DashboardResponseDto>(cacheKey);
      if (cached && 'grossRevenue' in cached) return cached;
    } catch (err) {
      this.logger.warn('Cache read failed, querying fresh data', err);
    }

    const { startDate, endDate } = this.periodToDateRange(period);
    const previousRange = comparePrevious
      ? this.previousPeriodRange(period, startDate, endDate)
      : null;

    const [summary, todayStats, topPerformers, previousSummary] = await Promise.all([
      this.analyticsRepo.getRevenueSummary(establishmentId, startDate, endDate),
      this.analyticsRepo.getTodayStats(establishmentId),
      this.analyticsRepo.getTopPerformers(establishmentId, startDate, endDate),
      previousRange
        ? this.analyticsRepo.getRevenueSummary(
            establishmentId,
            previousRange.startDate,
            previousRange.endDate,
          )
        : Promise.resolve(null),
    ]);

    const result: DashboardResponseDto = {
      grossRevenue: summary.grossRevenue,
      netRevenue: summary.netRevenue,
      totalBookings: summary.totalBookings,
      totalTips: summary.totalTips,
      totalPlatformFees: summary.totalPlatformFees,
      averageOrderValue: summary.averageOrderValue,
      today: todayStats,
      topBarber: topPerformers.topBarber,
      topService: topPerformers.topService,
      periodComparison: previousSummary
        ? {
            currentGrossRevenue: summary.grossRevenue,
            previousGrossRevenue: previousSummary.grossRevenue,
            currentNetRevenue: summary.netRevenue,
            previousNetRevenue: previousSummary.netRevenue,
            currentBookings: summary.totalBookings,
            previousBookings: previousSummary.totalBookings,
            currentTips: summary.totalTips,
            previousTips: previousSummary.totalTips,
            currentPlatformFees: summary.totalPlatformFees,
            previousPlatformFees: previousSummary.totalPlatformFees,
            revenueGrowthRate: this.growthRate(summary.grossRevenue, previousSummary.grossRevenue),
            netRevenueGrowthRate: this.growthRate(summary.netRevenue, previousSummary.netRevenue),
            bookingsGrowthRate: this.growthRate(
              summary.totalBookings,
              previousSummary.totalBookings,
            ),
            tipsGrowthRate: this.growthRate(summary.totalTips, previousSummary.totalTips),
            feesGrowthRate: this.growthRate(
              summary.totalPlatformFees,
              previousSummary.totalPlatformFees,
            ),
          }
        : undefined,
      revenueComposition: {
        bookingRevenue: summary.grossRevenue - summary.totalTips,
        tipsRevenue: summary.totalTips,
        platformFees: summary.totalPlatformFees,
        refunds: summary.totalRefunds,
      },
      generatedAt: new Date().toISOString(),
    };

    try {
      await this.cache.set(cacheKey, result, DASHBOARD_CACHE_TTL);
    } catch (err) {
      this.logger.warn('Cache write failed', err);
    }

    return result;
  }

  private periodToDateRange(period: DashboardPeriod): { startDate?: Date; endDate?: Date } {
    const now = new Date();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    switch (period) {
      case 'today': {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return { startDate: start, endDate: todayEnd };
      }
      case 'week': {
        const dayOfWeek = now.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);
        return { startDate: start, endDate: todayEnd };
      }
      case 'month': {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        return { startDate: start, endDate: todayEnd };
      }
      case 'quarter': {
        const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
        const start = new Date(now.getFullYear(), quarterMonth, 1);
        return { startDate: start, endDate: todayEnd };
      }
      case 'year': {
        const start = new Date(now.getFullYear(), 0, 1);
        return { startDate: start, endDate: todayEnd };
      }
      case 'all':
        return {};
    }
  }

  private previousPeriodRange(
    _period: DashboardPeriod,
    currentStart?: Date,
    currentEnd?: Date,
  ): { startDate: Date; endDate: Date } | null {
    if (!currentStart || !currentEnd) return null;

    const duration = currentEnd.getTime() - currentStart.getTime();
    const previousEnd = new Date(currentStart.getTime() - 1);
    const previousStart = new Date(previousEnd.getTime() - duration);

    return { startDate: previousStart, endDate: previousEnd };
  }

  private growthRate(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 10000) / 100;
  }
}
