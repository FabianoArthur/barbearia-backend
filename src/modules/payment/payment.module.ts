import { Module } from '@nestjs/common';
import { FinanceModule } from '../finance/finance.module';
import { FindPaymentsQueryHandler } from './application/queries/find-payments.query-handler';
import { FindRefundsQueryHandler } from './application/queries/find-refunds.query-handler';
import { PaymentService } from './application/services/payment.service';
import { PAYMENT_REPOSITORY } from './domain/interfaces/payment-repository.interface';
import { PrismaPaymentRepository } from './infrastructure/repositories/prisma-payment.repository';
import { PaymentController } from './presentation/controllers/payment.controller';

@Module({
  imports: [FinanceModule],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    FindPaymentsQueryHandler,
    FindRefundsQueryHandler,
    {
      provide: PAYMENT_REPOSITORY,
      useClass: PrismaPaymentRepository,
    },
  ],
  exports: [PaymentService],
})
export class PaymentModule {}
