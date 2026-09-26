import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExpenseCategory } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateExpenseDto {
  @ApiPropertyOptional({ description: 'Establishment ID (required for SUPER_ADMIN)' })
  @IsOptional()
  @IsUUID()
  readonly establishmentId?: string;
  @ApiProperty({
    enum: ExpenseCategory,
    description: 'Expense category',
    example: ExpenseCategory.SUPPLIES,
  })
  @IsEnum(ExpenseCategory)
  readonly category!: ExpenseCategory;

  @ApiProperty({
    description: 'Description of the expense',
    example: 'Shaving cream restock',
  })
  @IsString()
  @MaxLength(500)
  readonly description!: string;

  @ApiProperty({
    description: 'Expense amount',
    example: 150.0,
  })
  @IsNumber()
  @Min(0.01)
  readonly amount!: number;

  @ApiProperty({
    description: 'Date of the expense (ISO 8601)',
    example: '2026-02-10',
  })
  @IsDateString()
  readonly date!: string;

  @ApiPropertyOptional({
    description: 'Barber ID if this is a barber-specific expense',
  })
  @IsOptional()
  @IsUUID()
  readonly barberId?: string;
}
