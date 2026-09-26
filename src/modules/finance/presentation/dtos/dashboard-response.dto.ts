import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RevenueCompositionDto {
  @ApiProperty() readonly bookingRevenue!: number;
  @ApiProperty() readonly tipsRevenue!: number;
  @ApiProperty() readonly platformFees!: number;
  @ApiProperty() readonly refunds!: number;
}

export class PeriodComparisonDto {
  @ApiProperty() readonly currentGrossRevenue!: number;
  @ApiProperty() readonly previousGrossRevenue!: number;
  @ApiProperty() readonly currentNetRevenue!: number;
  @ApiProperty() readonly previousNetRevenue!: number;
  @ApiProperty() readonly currentBookings!: number;
  @ApiProperty() readonly previousBookings!: number;
  @ApiProperty() readonly currentTips!: number;
  @ApiProperty() readonly previousTips!: number;
  @ApiProperty() readonly currentPlatformFees!: number;
  @ApiProperty() readonly previousPlatformFees!: number;
  @ApiProperty({ description: 'Gross revenue growth rate (%)' })
  readonly revenueGrowthRate!: number;
  @ApiProperty({ description: 'Net revenue growth rate (%)' })
  readonly netRevenueGrowthRate!: number;
  @ApiProperty({ description: 'Bookings growth rate (%)' })
  readonly bookingsGrowthRate!: number;
  @ApiProperty({ description: 'Tips growth rate (%)' })
  readonly tipsGrowthRate!: number;
  @ApiProperty({ description: 'Platform fees growth rate (%)' })
  readonly feesGrowthRate!: number;
}

export class TopPerformerBarberDto {
  @ApiProperty() readonly barberId!: string;
  @ApiProperty() readonly barberName!: string;
  @ApiProperty() readonly grossRevenue!: number;
}

export class TopPerformerServiceDto {
  @ApiProperty() readonly serviceId!: string;
  @ApiProperty() readonly serviceName!: string;
  @ApiProperty() readonly bookingCount!: number;
}

export class TodayStatsDto {
  @ApiProperty() readonly revenue!: number;
  @ApiProperty() readonly bookingCount!: number;
  @ApiProperty() readonly tips!: number;
}

export class DashboardResponseDto {
  @ApiProperty() readonly grossRevenue!: number;
  @ApiProperty() readonly netRevenue!: number;
  @ApiProperty() readonly totalBookings!: number;
  @ApiProperty() readonly totalTips!: number;
  @ApiProperty() readonly totalPlatformFees!: number;
  @ApiProperty() readonly averageOrderValue!: number;

  @ApiProperty({ type: TodayStatsDto })
  readonly today!: TodayStatsDto;

  @ApiPropertyOptional({ type: PeriodComparisonDto })
  readonly periodComparison?: PeriodComparisonDto;

  @ApiPropertyOptional({ type: TopPerformerBarberDto })
  readonly topBarber?: TopPerformerBarberDto | null;

  @ApiPropertyOptional({ type: TopPerformerServiceDto })
  readonly topService?: TopPerformerServiceDto | null;

  @ApiProperty({ type: RevenueCompositionDto })
  readonly revenueComposition!: RevenueCompositionDto;

  @ApiProperty() readonly generatedAt!: string;
}
