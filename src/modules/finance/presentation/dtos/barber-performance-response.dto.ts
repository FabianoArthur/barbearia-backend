import { ApiProperty } from '@nestjs/swagger';

export class BarberPerformanceItemDto {
  @ApiProperty() readonly barberId!: string;
  @ApiProperty() readonly barberName!: string;
  @ApiProperty() readonly grossRevenue!: number;
  @ApiProperty() readonly netRevenue!: number;
  @ApiProperty() readonly totalTips!: number;
  @ApiProperty() readonly totalPlatformFees!: number;
  @ApiProperty() readonly bookingCount!: number;
  @ApiProperty() readonly averageOrderValue!: number;
  @ApiProperty() readonly tipsToRevenueRatio!: number;
  @ApiProperty() readonly rank!: number;
}

export class BarberPerformanceResponseDto {
  @ApiProperty({ type: [BarberPerformanceItemDto] })
  readonly barbers!: BarberPerformanceItemDto[];

  @ApiProperty() readonly generatedAt!: string;
}
