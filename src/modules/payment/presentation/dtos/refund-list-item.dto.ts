import { ApiProperty } from '@nestjs/swagger';

interface RefundListItemInput {
  id: string;
  amount: number;
  refundAmount: number | null;
  refundReason: string | null;
  refundedAt: Date | null;
  appointmentId: string;
  appointment: {
    id: string;
    barberId: string;
    clientId: string;
    startsAt: Date;
    status: string;
  };
}

export class RefundListItemDto {
  @ApiProperty()
  readonly id: string;

  @ApiProperty()
  readonly amount: number;

  @ApiProperty()
  readonly refundAmount: number | null;

  @ApiProperty()
  readonly refundReason: string | null;

  @ApiProperty()
  readonly refundedAt: Date | null;

  @ApiProperty()
  readonly appointmentId: string;

  @ApiProperty()
  readonly appointment: {
    id: string;
    barberId: string;
    clientId: string;
    startsAt: Date;
    status: string;
  };

  constructor(input: RefundListItemInput) {
    this.id = input.id;
    this.amount = input.amount;
    this.refundAmount = input.refundAmount;
    this.refundReason = input.refundReason;
    this.refundedAt = input.refundedAt;
    this.appointmentId = input.appointmentId;
    this.appointment = input.appointment;
  }

  static fromList(items: RefundListItemInput[]): RefundListItemDto[] {
    return items.map((i) => new RefundListItemDto(i));
  }
}
