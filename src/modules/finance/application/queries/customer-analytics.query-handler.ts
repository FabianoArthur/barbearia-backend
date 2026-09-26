import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import {
  FINANCE_ANALYTICS_REPOSITORY,
  type IFinanceAnalyticsRepository,
} from '../../domain/interfaces/finance-analytics-repository.interface';
import type { CustomerAnalyticsResponseDto } from '../../presentation/dtos/customer-analytics-response.dto';

const CUSTOMER_CACHE_TTL = 1_800_000; // 30 minutes

@Injectable()
export class CustomerAnalyticsQueryHandler {
  constructor(
    @Inject(FINANCE_ANALYTICS_REPOSITORY)
    private readonly analyticsRepo: IFinanceAnalyticsRepository,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async execute(
    establishmentId: string | undefined,
    startDate?: string,
    endDate?: string,
    topLimit?: number,
  ): Promise<CustomerAnalyticsResponseDto> {
    const cacheKey = `finance:customers:${establishmentId ?? 'all'}:${startDate ?? ''}:${endDate ?? ''}:${topLimit ?? 10}`;
    const cached = await this.cache.get<CustomerAnalyticsResponseDto>(cacheKey);
    if (cached) return cached;

    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const metrics = await this.analyticsRepo.getCustomerMetrics(
      establishmentId,
      start,
      end,
      topLimit,
    );

    const result: CustomerAnalyticsResponseDto = {
      totalCustomers: metrics.totalCustomers,
      newCustomers: metrics.newCustomers,
      returningCustomers: metrics.returningCustomers,
      averageBookingsPerCustomer: Math.round(metrics.averageBookingsPerCustomer * 100) / 100,
      topCustomers: metrics.topCustomers,
      retentionRate: Math.round(metrics.retentionRate * 10000) / 100,
      churnedCustomers: metrics.churnedCustomers,
      generatedAt: new Date().toISOString(),
    };

    await this.cache.set(cacheKey, result, CUSTOMER_CACHE_TTL);
    return result;
  }
}
