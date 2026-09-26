import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class CreateScheduleOverrideDto {
  @ApiProperty({ example: 'clx1234567890' })
  @IsString()
  @IsNotEmpty()
  barberId!: string;

  @ApiProperty({ example: '2026-03-01', description: 'Start date in ISO format' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ example: '2026-03-31', description: 'End date in ISO format' })
  @IsDateString()
  endDate!: string;

  @ApiPropertyOptional({
    example: 6,
    description: 'Day of week (0=Sunday, 6=Saturday)',
    minimum: 0,
    maximum: 6,
  })
  @IsInt()
  @Min(0)
  @Max(6)
  @IsOptional()
  weekday?: number;

  @ApiProperty({ example: '10:00', description: 'Start time in HH:mm format' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'startTime must be in HH:mm format' })
  startTime!: string;

  @ApiProperty({ example: '14:00', description: 'End time in HH:mm format' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'endTime must be in HH:mm format' })
  endTime!: string;

  @ApiPropertyOptional({ example: 'Holiday special hours' })
  @IsString()
  @IsOptional()
  reason?: string;
}
