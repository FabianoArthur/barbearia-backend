import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsUUID } from 'class-validator';

const PERIODS = ['today', 'week', 'month', 'quarter', 'year', 'all'] as const;
export type DashboardPeriod = (typeof PERIODS)[number];

export class DashboardQueryDto {
  @ApiPropertyOptional({ description: 'Establishment ID (omit to aggregate)' })
  @IsOptional()
  @IsUUID()
  readonly establishmentId?: string;

  @ApiPropertyOptional({
    enum: PERIODS,
    default: 'month',
    description: 'Time period filter',
  })
  @IsOptional()
  @IsIn(PERIODS)
  readonly period: DashboardPeriod = 'month';

  @ApiPropertyOptional({
    default: true,
    description: 'Include comparison with previous period',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  readonly comparePrevious: boolean = true;
}
