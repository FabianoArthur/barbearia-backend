import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Payment } from '@prisma/client';

export class PaymentResponseDto {
  @ApiProperty({ example: 'uuid' })
  readonly id: string;

  @ApiProperty({ example: 'uuid' })
  readonly appointmentId: string;

  @ApiProperty({ example: 'uuid' })
  readonly establishmentId: string;

  @ApiProperty({ example: 75.0 })
  readonly amount: number;

  @ApiProperty({ example: 10.0 })
  readonly tipAmount: number;

  @ApiProperty({ example: 3.75 })
  readonly platformFeeAmount: number;

  @ApiPropertyOptional({ example: 'PIX', nullable: true })
  readonly method: string | null;

  @ApiProperty({ example: 'PENDING' })
  readonly status: string;

  @ApiPropertyOptional({ example: '2026-02-10T12:00:00Z', nullable: true })
  readonly paidAt: Date | null;

  @ApiPropertyOptional({ example: null, nullable: true })
  readonly refundedAt: Date | null;

  @ApiPropertyOptional({ example: null, nullable: true })
  readonly refundAmount: number | null;

  @ApiPropertyOptional({ example: null, nullable: true })
  readonly refundReason: string | null;

  @ApiPropertyOptional({ example: null, nullable: true })
  readonly notes: string | null;

  @ApiProperty()
  readonly createdAt: Date;

  @ApiProperty()
  readonly updatedAt: Date;

  constructor(payment: Payment) {
    this.id = payment.id;
    this.appointmentId = payment.appointmentId;
    this.establishmentId = payment.establishmentId;
    this.amount = payment.amount;
    this.tipAmount = payment.tipAmount;
    this.platformFeeAmount = payment.platformFeeAmount;
    this.method = payment.method;
    this.status = payment.status;
    this.paidAt = payment.paidAt;
    this.refundedAt = payment.refundedAt;
    this.refundAmount = payment.refundAmount;
    this.refundReason = payment.refundReason;
    this.notes = payment.notes;
    this.createdAt = payment.createdAt;
    this.updatedAt = payment.updatedAt;
  }

  static fromDomain(payment: Payment): PaymentResponseDto {
    return new PaymentResponseDto(payment);
  }

  static fromDomainList(payments: Payment[]): PaymentResponseDto[] {
    return payments.map((p) => new PaymentResponseDto(p));
  }
}
