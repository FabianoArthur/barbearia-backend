import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import type { Granularity } from '../../domain/interfaces/finance-analytics-repository.interface';

const GRANULARITIES = ['day', 'week', 'month'] as const;

export class ForecastingQueryDto {
  @ApiPropertyOptional({ description: 'Establishment ID (omit to aggregate)' })
  @IsOptional()
  @IsUUID()
  readonly establishmentId?: string;

  @ApiPropertyOptional({
    enum: GRANULARITIES,
    default: 'month',
    description: 'Forecast granularity',
  })
  @IsOptional()
  @IsIn(GRANULARITIES)
  readonly granularity: Granularity = 'month';

  @ApiPropertyOptional({
    default: 3,
    description: 'Number of periods to forecast',
    minimum: 1,
    maximum: 12,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  readonly periodsAhead: number = 3;

  @ApiPropertyOptional({
    default: 12,
    description: 'Number of historical periods for moving average',
    minimum: 3,
    maximum: 24,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(3)
  @Max(24)
  readonly lookbackPeriods: number = 12;
}
