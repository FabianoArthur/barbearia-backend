import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional, IsUUID } from 'class-validator';
import type { Granularity } from '../../domain/interfaces/finance-analytics-repository.interface';

const GRANULARITIES = ['hour', 'day', 'week', 'month', 'quarter', 'year'] as const;

const METRICS = ['revenue', 'bookings', 'tips', 'fees'] as const;
export type TimeSeriesMetric = (typeof METRICS)[number];

export class TimeSeriesQueryDto {
  @ApiPropertyOptional({ description: 'Establishment ID (omit to aggregate)' })
  @IsOptional()
  @IsUUID()
  readonly establishmentId?: string;

  @ApiProperty({ description: 'Start date (ISO format)', example: '2026-01-01' })
  @IsDateString()
  readonly startDate!: string;

  @ApiProperty({ description: 'End date (ISO format)', example: '2026-12-31' })
  @IsDateString()
  readonly endDate!: string;

  @ApiPropertyOptional({
    enum: GRANULARITIES,
    default: 'month',
    description: 'Time grouping granularity',
  })
  @IsOptional()
  @IsIn(GRANULARITIES)
  readonly granularity: Granularity = 'month';

  @ApiPropertyOptional({
    enum: METRICS,
    default: 'revenue',
    description: 'Primary metric to analyze',
  })
  @IsOptional()
  @IsIn(METRICS)
  readonly metric: TimeSeriesMetric = 'revenue';
}
