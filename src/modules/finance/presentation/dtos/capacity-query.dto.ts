import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class CapacityQueryDto {
  @ApiPropertyOptional({ description: 'Establishment ID (omit to aggregate)' })
  @IsOptional()
  @IsUUID()
  readonly establishmentId?: string;

  @ApiProperty({ description: 'Start date (ISO format)', example: '2026-02-01' })
  @IsDateString()
  readonly startDate!: string;

  @ApiProperty({ description: 'End date (ISO format)', example: '2026-02-28' })
  @IsDateString()
  readonly endDate!: string;

  @ApiPropertyOptional({ description: 'Filter by specific barber ID' })
  @IsOptional()
  @IsUUID()
  readonly barberId?: string;
}
