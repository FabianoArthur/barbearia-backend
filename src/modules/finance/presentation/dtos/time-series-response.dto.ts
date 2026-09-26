import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TimeSeriesDataPointDto {
  @ApiProperty() readonly period!: string;
  @ApiProperty() readonly grossRevenue!: number;
  @ApiProperty() readonly netRevenue!: number;
  @ApiProperty() readonly bookingCount!: number;
  @ApiProperty() readonly totalTips!: number;
  @ApiProperty() readonly totalPlatformFees!: number;
}

export class PeakPeriodDto {
  @ApiProperty() readonly period!: string;
  @ApiProperty() readonly value!: number;
}

export class GrowthRateDto {
  @ApiProperty() readonly period!: string;
  @ApiProperty() readonly growthRate!: number;
}

export class TimeSeriesResponseDto {
  @ApiProperty({ type: [TimeSeriesDataPointDto] })
  readonly current!: TimeSeriesDataPointDto[];

  @ApiPropertyOptional({ type: [TimeSeriesDataPointDto] })
  readonly previous?: TimeSeriesDataPointDto[];

  @ApiPropertyOptional({ type: PeakPeriodDto })
  readonly peakPeriod?: PeakPeriodDto | null;

  @ApiProperty({ type: [GrowthRateDto] })
  readonly growthRates!: GrowthRateDto[];

  @ApiProperty() readonly generatedAt!: string;
}
