import { Inject, Injectable } from '@nestjs/common';
import {
  type IPaymentRepository,
  PAYMENT_REPOSITORY,
} from '../../domain/interfaces/payment-repository.interface';
import type { FindPaymentsQueryDto } from '../../presentation/dtos/find-payments-query.dto';

@Injectable()
export class FindPaymentsQueryHandler {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: IPaymentRepository,
  ) {}

  async execute(establishmentId: string | undefined, query: FindPaymentsQueryDto) {
    const result = await this.paymentRepository.findAllPaginated({
      skip: query.skip,
      limit: query.limit,
      establishmentId,
      status: query.status,
      method: query.method,
      startDate: query.startDate ? this.toStartOfDay(query.startDate) : undefined,
      endDate: query.endDate ? this.toEndOfDay(query.endDate) : undefined,
    });

    return { ...result, page: query.page, limit: query.limit };
  }

  private toStartOfDay(dateStr: string): Date {
    const date = new Date(dateStr);
    date.setUTCHours(0, 0, 0, 0);
    return date;
  }

  private toEndOfDay(dateStr: string): Date {
    const date = new Date(dateStr);
    date.setUTCHours(23, 59, 59, 999);
    return date;
  }
}
