import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import {
  FINANCE_ANALYTICS_REPOSITORY,
  type IFinanceAnalyticsRepository,
} from '../../domain/interfaces/finance-analytics-repository.interface';
import type { BarberPerformanceResponseDto } from '../../presentation/dtos/barber-performance-response.dto';

const BARBER_PERF_CACHE_TTL = 300_000; // 5 minutes

@Injectable()
export class BarberPerformanceQueryHandler {
  constructor(
    @Inject(FINANCE_ANALYTICS_REPOSITORY)
    private readonly analyticsRepo: IFinanceAnalyticsRepository,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async execute(
    establishmentId: string | undefined,
    startDate?: string,
    endDate?: string,
    barberId?: string,
  ): Promise<BarberPerformanceResponseDto> {
    const cacheKey = `finance:barber-perf:${establishmentId ?? 'all'}:${startDate ?? ''}:${endDate ?? ''}:${barberId ?? ''}`;
    const cached = await this.cache.get<BarberPerformanceResponseDto>(cacheKey);
    if (cached) return cached;

    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const barberRevenues = await this.analyticsRepo.getRevenueByBarber(establishmentId, start, end);

    const filtered = barberId
      ? barberRevenues.filter((b) => b.barberId === barberId)
      : barberRevenues;

    // Already sorted by grossRevenue desc from repository
    const barbers = filtered.map((b, index) => ({
      ...b,
      rank: index + 1,
    }));

    const result: BarberPerformanceResponseDto = {
      barbers,
      generatedAt: new Date().toISOString(),
    };

    await this.cache.set(cacheKey, result, BARBER_PERF_CACHE_TTL);
    return result;
  }
}
