import { ApiProperty } from '@nestjs/swagger';

export class FinancialBreakdownResponseDto {
  @ApiProperty({ description: 'Total booking prices (excluding tips)' })
  readonly bookingRevenue!: number;

  @ApiProperty({ description: 'Total tips collected' })
  readonly totalTips!: number;

  @ApiProperty({ description: 'Gross revenue (bookings + tips)' })
  readonly grossRevenue!: number;

  @ApiProperty({ description: 'Total platform fees deducted' })
  readonly totalPlatformFees!: number;

  @ApiProperty({ description: 'Total refunds issued' })
  readonly totalRefunds!: number;

  @ApiProperty({ description: 'Net revenue (gross - fees - refunds)' })
  readonly netRevenue!: number;

  @ApiProperty({ description: 'Platform fees as percentage of gross revenue' })
  readonly feeToRevenueRatio!: number;

  @ApiProperty({ description: 'Average platform fee per booking' })
  readonly averageFeePerBooking!: number;

  @ApiProperty({ description: 'Refund rate (refunds / gross revenue)' })
  readonly refundRate!: number;

  @ApiProperty({ description: 'Total number of bookings' })
  readonly totalBookings!: number;

  @ApiProperty() readonly generatedAt!: string;
}
