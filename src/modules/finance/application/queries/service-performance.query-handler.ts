import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import {
  FINANCE_ANALYTICS_REPOSITORY,
  type Granularity,
  type IFinanceAnalyticsRepository,
} from '../../domain/interfaces/finance-analytics-repository.interface';
import type { ServicePerformanceResponseDto } from '../../presentation/dtos/service-performance-response.dto';

const SERVICE_PERF_CACHE_TTL = 300_000; // 5 minutes

@Injectable()
export class ServicePerformanceQueryHandler {
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
    serviceId?: string,
  ): Promise<ServicePerformanceResponseDto> {
    const cacheKey = `finance:service-perf:${establishmentId ?? 'all'}:${granularity}:${startDate ?? ''}:${endDate ?? ''}:${serviceId ?? ''}`;
    const cached = await this.cache.get<ServicePerformanceResponseDto>(cacheKey);
    if (cached) return cached;

    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const [serviceRevenues, periodData] = await Promise.all([
      this.analyticsRepo.getRevenueByService(establishmentId, start, end),
      this.analyticsRepo.getRevenueByPeriod(establishmentId, granularity, start, end),
    ]);

    const filtered = serviceId
      ? serviceRevenues.filter((s) => s.serviceId === serviceId)
      : serviceRevenues;

    const services = filtered.map((s, index) => ({
      ...s,
      rank: index + 1,
    }));

    const trends = periodData.map((p) => ({
      period: p.period,
      bookingCount: p.bookingCount,
      grossRevenue: p.grossRevenue,
    }));

    const result: ServicePerformanceResponseDto = {
      services,
      trends,
      generatedAt: new Date().toISOString(),
    };

    await this.cache.set(cacheKey, result, SERVICE_PERF_CACHE_TTL);
    return result;
  }
}
