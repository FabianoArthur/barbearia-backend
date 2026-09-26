import { ApiPropertyOptional } from '@nestjs/swagger';
import { ExpenseCategory } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class FindExpensesQueryDto {
  @ApiPropertyOptional({ description: 'Filter by establishment ID' })
  @IsOptional()
  @IsUUID()
  readonly establishmentId?: string;

  @ApiPropertyOptional({ description: 'Filter by barber ID' })
  @IsOptional()
  @IsUUID()
  readonly barberId?: string;

  @ApiPropertyOptional({
    enum: ExpenseCategory,
    description: 'Filter by category',
  })
  @IsOptional()
  @IsEnum(ExpenseCategory)
  readonly category?: ExpenseCategory;

  @ApiPropertyOptional({
    description: 'Start date (ISO 8601)',
    example: '2026-01-01',
  })
  @IsOptional()
  @IsDateString()
  readonly startDate?: string;

  @ApiPropertyOptional({
    description: 'End date (ISO 8601)',
    example: '2026-12-31',
  })
  @IsOptional()
  @IsDateString()
  readonly endDate?: string;

  @ApiPropertyOptional({ minimum: 1, default: 1, description: 'Page number' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly page: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20, description: 'Items per page' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  readonly pageSize: number = 20;
}
