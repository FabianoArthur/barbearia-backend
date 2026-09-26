import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export interface RefundDetailInput {
  id: string;
  appointmentId: string;
  establishmentId: string;
  amount: number;
  tipAmount: number;
  platformFeeAmount: number;
  method: string | null;
  status: string;
  paidAt: Date | null;
  refundedAt: Date | null;
  refundAmount: number | null;
  refundReason: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  appointment: {
    barber: { user: { name: string } };
    client: { name: string };
    service: { name: string };
  };
}

export class RefundDetailResponseDto {
  @ApiProperty()
  readonly id: string;

  @ApiProperty()
  readonly appointmentId: string;

  @ApiProperty()
  readonly establishmentId: string;

  @ApiProperty()
  readonly amount: number;

  @ApiProperty()
  readonly tipAmount: number;

  @ApiProperty()
  readonly platformFeeAmount: number;

  @ApiPropertyOptional({ nullable: true })
  readonly method: string | null;

  @ApiProperty()
  readonly status: string;

  @ApiPropertyOptional({ nullable: true })
  readonly paidAt: Date | null;

  @ApiPropertyOptional({ nullable: true })
  readonly refundedAt: Date | null;

  @ApiPropertyOptional({ nullable: true })
  readonly refundAmount: number | null;

  @ApiPropertyOptional({ nullable: true })
  readonly refundReason: string | null;

  @ApiPropertyOptional({ nullable: true })
  readonly notes: string | null;

  @ApiProperty()
  readonly createdAt: Date;

  @ApiProperty()
  readonly updatedAt: Date;

  @ApiProperty({
    description: 'Appointment context with barber, client, and service names',
  })
  readonly appointment: {
    barberName: string;
    clientName: string;
    serviceName: string;
  };

  constructor(payment: RefundDetailInput) {
    const { appointment } = payment;
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
    this.appointment = {
      barberName: appointment.barber.user.name,
      clientName: appointment.client.name,
      serviceName: appointment.service.name,
    };
  }

  static fromDomain(payment: RefundDetailInput) {
    return new RefundDetailResponseDto(payment);
  }
}
