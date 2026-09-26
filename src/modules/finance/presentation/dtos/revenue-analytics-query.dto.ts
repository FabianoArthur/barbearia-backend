import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsDateString, IsIn, IsOptional, IsUUID } from 'class-validator';
import type { Granularity } from '../../domain/interfaces/finance-analytics-repository.interface';

const GRANULARITIES = ['hour', 'day', 'week', 'month', 'quarter', 'year'] as const;

export class RevenueAnalyticsQueryDto {
  @ApiPropertyOptional({ description: 'Establishment ID (omit to aggregate)' })
  @IsOptional()
  @IsUUID()
  readonly establishmentId?: string;

  @ApiPropertyOptional({ description: 'Start date (ISO format)', example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  readonly startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO format)', example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  readonly endDate?: string;

  @ApiPropertyOptional({
    enum: GRANULARITIES,
    default: 'month',
    description: 'Time grouping granularity',
  })
  @IsOptional()
  @IsIn(GRANULARITIES)
  readonly granularity: Granularity = 'month';

  @ApiPropertyOptional({ description: 'Filter by barber ID' })
  @IsOptional()
  @IsUUID()
  readonly barberId?: string;

  @ApiPropertyOptional({ description: 'Filter by service ID' })
  @IsOptional()
  @IsUUID()
  readonly serviceId?: string;

  @ApiPropertyOptional({
    description: 'Include previous-period data for side-by-side comparison',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  readonly comparePrevious: boolean = false;
}
