import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  BarberRevenue,
  PeriodRevenue,
  RevenueSummary,
  ServiceRevenue,
} from '../../domain/interfaces/finance-analytics-repository.interface';

export class RevenueSummaryDto {
  @ApiProperty() readonly grossRevenue!: number;
  @ApiProperty() readonly netRevenue!: number;
  @ApiProperty() readonly totalBookings!: number;
  @ApiProperty() readonly totalTips!: number;
  @ApiProperty() readonly totalPlatformFees!: number;
  @ApiProperty() readonly totalRefunds!: number;
  @ApiProperty() readonly averageOrderValue!: number;
}

export class PeriodRevenueDto {
  @ApiProperty() readonly period!: string;
  @ApiProperty() readonly grossRevenue!: number;
  @ApiProperty() readonly netRevenue!: number;
  @ApiProperty() readonly totalTips!: number;
  @ApiProperty() readonly totalPlatformFees!: number;
  @ApiProperty() readonly bookingCount!: number;
}

export class BarberRevenueDto {
  @ApiProperty() readonly barberId!: string;
  @ApiProperty() readonly barberName!: string;
  @ApiProperty() readonly grossRevenue!: number;
  @ApiProperty() readonly netRevenue!: number;
  @ApiProperty() readonly totalTips!: number;
  @ApiProperty() readonly totalPlatformFees!: number;
  @ApiProperty() readonly bookingCount!: number;
  @ApiProperty() readonly averageOrderValue!: number;
  @ApiProperty() readonly tipsToRevenueRatio!: number;
}

export class ServiceRevenueDto {
  @ApiProperty() readonly serviceId!: string;
  @ApiProperty() readonly serviceName!: string;
  @ApiProperty() readonly grossRevenue!: number;
  @ApiProperty() readonly netRevenue!: number;
  @ApiProperty() readonly bookingCount!: number;
  @ApiProperty() readonly averagePrice!: number;
  @ApiProperty() readonly durationMinutes!: number;
  @ApiProperty() readonly revenuePerMinute!: number;
}

export class RevenueAnalyticsResponseDto {
  @ApiProperty({ type: RevenueSummaryDto }) readonly summary!: RevenueSummary;
  @ApiProperty({ type: [PeriodRevenueDto] }) readonly byPeriod!: PeriodRevenue[];
  @ApiProperty({ type: [BarberRevenueDto] }) readonly byBarber!: BarberRevenue[];
  @ApiProperty({ type: [ServiceRevenueDto] }) readonly byService!: ServiceRevenue[];

  @ApiPropertyOptional({
    type: RevenueSummaryDto,
    description: 'Previous-period summary for comparison',
  })
  readonly previousSummary?: RevenueSummary;

  @ApiPropertyOptional({
    type: [PeriodRevenueDto],
    description: 'Previous-period breakdown by time bucket',
  })
  readonly previousByPeriod?: PeriodRevenue[];

  @ApiProperty() readonly generatedAt!: string;
}
