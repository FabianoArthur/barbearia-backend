import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import {
  FINANCE_ANALYTICS_REPOSITORY,
  type IFinanceAnalyticsRepository,
} from '../../domain/interfaces/finance-analytics-repository.interface';
import type { FinancialBreakdownResponseDto } from '../../presentation/dtos/financial-breakdown-response.dto';

const BREAKDOWN_CACHE_TTL = 600_000; // 10 minutes

@Injectable()
export class FinancialBreakdownQueryHandler {
  constructor(
    @Inject(FINANCE_ANALYTICS_REPOSITORY)
    private readonly analyticsRepo: IFinanceAnalyticsRepository,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async execute(
    establishmentId: string | undefined,
    startDate?: string,
    endDate?: string,
  ): Promise<FinancialBreakdownResponseDto> {
    const cacheKey = `finance:breakdown:${establishmentId ?? 'all'}:${startDate ?? ''}:${endDate ?? ''}`;
    const cached = await this.cache.get<FinancialBreakdownResponseDto>(cacheKey);
    if (cached) return cached;

    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const summary = await this.analyticsRepo.getRevenueSummary(establishmentId, start, end);

    const bookingRevenue = summary.grossRevenue - summary.totalTips;
    const feeToRevenueRatio =
      summary.grossRevenue > 0
        ? Math.round((summary.totalPlatformFees / summary.grossRevenue) * 10000) / 100
        : 0;
    const averageFeePerBooking =
      summary.totalBookings > 0
        ? Math.round((summary.totalPlatformFees / summary.totalBookings) * 100) / 100
        : 0;
    const refundRate =
      summary.grossRevenue > 0
        ? Math.round((summary.totalRefunds / summary.grossRevenue) * 10000) / 100
        : 0;

    const result: FinancialBreakdownResponseDto = {
      bookingRevenue,
      totalTips: summary.totalTips,
      grossRevenue: summary.grossRevenue,
      totalPlatformFees: summary.totalPlatformFees,
      totalRefunds: summary.totalRefunds,
      netRevenue: summary.netRevenue,
      feeToRevenueRatio,
      averageFeePerBooking,
      refundRate,
      totalBookings: summary.totalBookings,
      generatedAt: new Date().toISOString(),
    };

    await this.cache.set(cacheKey, result, BREAKDOWN_CACHE_TTL);
    return result;
  }
}
