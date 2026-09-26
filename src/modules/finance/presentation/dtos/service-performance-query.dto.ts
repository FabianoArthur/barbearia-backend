import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional, IsUUID } from 'class-validator';
import type { Granularity } from '../../domain/interfaces/finance-analytics-repository.interface';

const GRANULARITIES = ['day', 'week', 'month', 'quarter', 'year'] as const;

export class ServicePerformanceQueryDto {
  @ApiPropertyOptional({ description: 'Establishment ID (omit to aggregate)' })
  @IsOptional()
  @IsUUID()
  readonly establishmentId?: string;

  @ApiPropertyOptional({ description: 'Start date (ISO format)' })
  @IsOptional()
  @IsDateString()
  readonly startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO format)' })
  @IsOptional()
  @IsDateString()
  readonly endDate?: string;

  @ApiPropertyOptional({ description: 'Filter by specific service ID' })
  @IsOptional()
  @IsUUID()
  readonly serviceId?: string;

  @ApiPropertyOptional({
    enum: GRANULARITIES,
    default: 'month',
    description: 'Trend granularity',
  })
  @IsOptional()
  @IsIn(GRANULARITIES)
  readonly granularity: Granularity = 'month';
}
