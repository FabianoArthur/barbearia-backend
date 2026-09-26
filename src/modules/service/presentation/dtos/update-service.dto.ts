import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateServiceDto {
  @ApiPropertyOptional({ example: 'Beard Trim' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 35.0, minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({ example: 20, minimum: 1, description: 'Duration in minutes' })
  @IsInt()
  @Min(1)
  @IsOptional()
  durationMinutes?: number;

  @ApiPropertyOptional({ example: 'Includes wash and styling', description: 'Service notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
