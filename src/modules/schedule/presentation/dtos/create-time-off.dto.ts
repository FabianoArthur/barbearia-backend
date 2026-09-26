import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreateTimeOffDto {
  @ApiProperty({ example: 'clx1234567890' })
  @IsString()
  @IsNotEmpty()
  barberId!: string;

  @ApiProperty({ example: '2026-03-15', description: 'Date in ISO format' })
  @IsDateString()
  date!: string;

  @ApiPropertyOptional({
    example: '09:00',
    description: 'Start time in HH:mm format (omit for full day)',
  })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'startTime must be in HH:mm format' })
  @IsOptional()
  startTime?: string;

  @ApiPropertyOptional({
    example: '12:00',
    description: 'End time in HH:mm format (omit for full day)',
  })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'endTime must be in HH:mm format' })
  @IsOptional()
  endTime?: string;

  @ApiPropertyOptional({ example: 'Medical appointment' })
  @IsString()
  @IsOptional()
  reason?: string;
}
