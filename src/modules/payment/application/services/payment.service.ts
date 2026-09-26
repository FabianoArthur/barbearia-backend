import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { DomainError, DomainErrorCode } from '../../../../common/errors';
import { RefundCreatedEvent } from '../../../../common/events';
import { PlatformFeeService } from '../../../finance/application/services/platform-fee.service';
import {
  type FindPaymentsFilter,
  type IPaymentRepository,
  PAYMENT_REPOSITORY,
} from '../../domain/interfaces/payment-repository.interface';
import { isValidPaymentTransition } from '../../domain/payment-status-machine';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: IPaymentRepository,
    private readonly platformFeeService: PlatformFeeService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createPendingPayment(appointment: {
    id: string;
    establishmentId: string;
    priceSnapshot: number;
  }) {
    const existing = await this.paymentRepository.findByAppointmentId(appointment.id);
    if (existing) {
      this.logger.warn(`Payment already exists for appointment ${appointment.id}`);
      return existing;
    }

    const payment = await this.paymentRepository.create({
      appointmentId: appointment.id,
      establishmentId: appointment.establishmentId,
      amount: appointment.priceSnapshot,
    });

    this.logger.log(`Pending payment created for appointment ${appointment.id}`);
    return payment;
  }

  async confirmPayment(id: string, method: PaymentMethod, tipAmount?: number, notes?: string) {
    const payment = await this.findByIdOrThrow(id);

    if (!isValidPaymentTransition(payment.status, PaymentStatus.COMPLETED)) {
      throw DomainError.badRequest(
        DomainErrorCode.PAYMENT_INVALID_TRANSITION,
        `Cannot confirm payment with status ${payment.status}`,
      );
    }

    const tip = tipAmount ?? 0;

    let platformFeeAmount = 0;
    const feeConfig = await this.platformFeeService.getActiveConfig(payment.establishmentId);
    if (feeConfig) {
      const feeResult = this.platformFeeService.calculateFee(feeConfig, payment.amount, tip);
      platformFeeAmount = feeResult.feeAmount;
    }

    const updated = await this.paymentRepository.update(id, {
      method,
      status: PaymentStatus.COMPLETED,
      paidAt: new Date(),
      tipAmount: tip,
      platformFeeAmount,
      notes: notes ?? payment.notes ?? undefined,
    });

    this.logger.log(`Payment ${id} confirmed with method ${method}, tip ${tip}`);
    return updated;
  }

  async refundPayment(id: string, amount?: number, reason?: string) {
    const payment = await this.findByIdOrThrow(id);

    if (!isValidPaymentTransition(payment.status, PaymentStatus.REFUNDED)) {
      throw DomainError.badRequest(
        DomainErrorCode.PAYMENT_INVALID_TRANSITION,
        `Cannot refund payment with status ${payment.status}`,
      );
    }

    const refundAmount = amount ?? payment.amount;
    if (refundAmount > payment.amount) {
      throw DomainError.badRequest(
        DomainErrorCode.VALIDATION_ERROR,
        'Refund amount cannot exceed payment amount',
      );
    }

    const updated = await this.paymentRepository.update(id, {
      status: PaymentStatus.REFUNDED,
      refundedAt: new Date(),
      refundAmount,
      refundReason: reason,
    });

    this.logger.log(`Payment ${id} refunded (${refundAmount})`);

    this.eventEmitter.emit(
      RefundCreatedEvent.event,
      new RefundCreatedEvent(id, payment.appointmentId, refundAmount, reason ?? null, null),
    );

    return updated;
  }

  async failPayment(id: string, notes?: string) {
    const payment = await this.findByIdOrThrow(id);

    if (!isValidPaymentTransition(payment.status, PaymentStatus.FAILED)) {
      throw DomainError.badRequest(
        DomainErrorCode.PAYMENT_INVALID_TRANSITION,
        `Cannot fail payment with status ${payment.status}`,
      );
    }

    const updated = await this.paymentRepository.update(id, {
      status: PaymentStatus.FAILED,
      notes: notes ?? payment.notes ?? undefined,
    });

    this.logger.log(`Payment ${id} marked as failed`);
    return updated;
  }

  async findByEstablishment(filters: FindPaymentsFilter) {
    return this.paymentRepository.findByEstablishment(filters);
  }

  async findByAppointmentId(appointmentId: string) {
    const payment = await this.paymentRepository.findByAppointmentId(appointmentId);
    if (!payment) {
      throw DomainError.notFound(
        DomainErrorCode.PAYMENT_NOT_FOUND,
        `Payment not found for appointment ${appointmentId}`,
      );
    }
    return payment;
  }

  async findById(id: string) {
    return this.findByIdOrThrow(id);
  }

  private async findByIdOrThrow(id: string) {
    const payment = await this.paymentRepository.findById(id);
    if (!payment) {
      throw DomainError.notFound(DomainErrorCode.PAYMENT_NOT_FOUND, `Payment ${id} not found`);
    }
    return payment;
  }
}
