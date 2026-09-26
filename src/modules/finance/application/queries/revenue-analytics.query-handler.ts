import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import {
  FINANCE_ANALYTICS_REPOSITORY,
  type Granularity,
  type IFinanceAnalyticsRepository,
} from '../../domain/interfaces/finance-analytics-repository.interface';
import type { RevenueAnalyticsResponseDto } from '../../presentation/dtos/revenue-analytics-response.dto';

const ANALYTICS_CACHE_TTL = 900_000; // 15 minutes

@Injectable()
export class RevenueAnalyticsQueryHandler {
  constructor(
    @Inject(FINANCE_ANALYTICS_REPOSITORY)
    private readonly analyticsRepo: IFinanceAnalyticsRepository,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async execute(
    establishmentId: string | undefined,
    granularity: Granularity,
    startDate?: string,
    endDate?: string,
    barberId?: string,
    serviceId?: string,
    comparePrevious = false,
  ): Promise<RevenueAnalyticsResponseDto> {
    const cacheKey = `finance:revenue:${establishmentId ?? 'all'}:${granularity}:${startDate ?? ''}:${endDate ?? ''}:${barberId ?? ''}:${serviceId ?? ''}:${comparePrevious}`;
    const cached = await this.cache.get<RevenueAnalyticsResponseDto>(cacheKey);
    if (cached) return cached;

    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const previousRange =
      comparePrevious && start && end ? this.previousPeriodRange(start, end) : null;

    const [summary, byPeriod, byBarber, byService, previousSummary, previousByPeriod] =
      await Promise.all([
        this.analyticsRepo.getRevenueSummary(establishmentId, start, end),
        this.analyticsRepo.getRevenueByPeriod(establishmentId, granularity, start, end),
        this.analyticsRepo.getRevenueByBarber(establishmentId, start, end),
        this.analyticsRepo.getRevenueByService(establishmentId, start, end),
        previousRange
          ? this.analyticsRepo.getRevenueSummary(
              establishmentId,
              previousRange.startDate,
              previousRange.endDate,
            )
          : Promise.resolve(undefined),
        previousRange
          ? this.analyticsRepo.getRevenueByPeriod(
              establishmentId,
              granularity,
              previousRange.startDate,
              previousRange.endDate,
            )
          : Promise.resolve(undefined),
      ]);

    // Filter by barber/service if requested
    const filteredByBarber = barberId ? byBarber.filter((b) => b.barberId === barberId) : byBarber;
    const filteredByService = serviceId
      ? byService.filter((s) => s.serviceId === serviceId)
      : byService;

    const result: RevenueAnalyticsResponseDto = {
      summary,
      byPeriod,
      byBarber: filteredByBarber,
      byService: filteredByService,
      previousSummary,
      previousByPeriod,
      generatedAt: new Date().toISOString(),
    };

    // Use shorter TTL if the range includes today
    const ttl = this.includesCurrentDay(start, end) ? 120_000 : ANALYTICS_CACHE_TTL;
    await this.cache.set(cacheKey, result, ttl);

    return result;
  }

  private previousPeriodRange(
    currentStart: Date,
    currentEnd: Date,
  ): { startDate: Date; endDate: Date } {
    const duration = currentEnd.getTime() - currentStart.getTime();
    const previousEnd = new Date(currentStart.getTime() - 1);
    const previousStart = new Date(previousEnd.getTime() - duration);
    return { startDate: previousStart, endDate: previousEnd };
  }

  private includesCurrentDay(_start?: Date, end?: Date): boolean {
    if (!end) return true; // no end date means it includes today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return end >= today;
  }
}
