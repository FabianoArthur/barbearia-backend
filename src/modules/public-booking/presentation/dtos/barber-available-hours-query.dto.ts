import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class BarberAvailableHoursQueryDto {
  @ApiPropertyOptional({
    example: '2026-02-09',
    description: 'Start date in ISO format. Defaults to today.',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2026-02-16',
    description: 'End date in ISO format. Defaults to startDate + 7 days.',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
