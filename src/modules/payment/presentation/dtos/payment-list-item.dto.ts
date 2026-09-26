import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { PaymentListItem } from '../../domain/interfaces/payment-repository.interface';

export class PaymentListItemDto {
  @ApiProperty({ example: 'uuid' })
  readonly id: string;

  @ApiPropertyOptional({ example: 'PIX', nullable: true })
  readonly method: string | null;

  @ApiProperty({ example: 'PENDING' })
  readonly status: string;

  @ApiProperty({ example: 10.0 })
  readonly tipAmount: number;

  @ApiProperty({ example: 75.0 })
  readonly amount: number;

  @ApiPropertyOptional({ example: null, nullable: true })
  readonly notes: string | null;

  @ApiProperty()
  readonly createdAt: Date;

  @ApiProperty()
  readonly updatedAt: Date;

  constructor(item: PaymentListItem) {
    this.id = item.id;
    this.method = item.method;
    this.status = item.status;
    this.tipAmount = item.tipAmount;
    this.amount = item.amount;
    this.notes = item.notes;
    this.createdAt = item.createdAt;
    this.updatedAt = item.updatedAt;
  }

  static fromDomain(item: PaymentListItem): PaymentListItemDto {
    return new PaymentListItemDto(item);
  }

  static fromDomainList(items: PaymentListItem[]): PaymentListItemDto[] {
    return items.map((i) => new PaymentListItemDto(i));
  }
}
