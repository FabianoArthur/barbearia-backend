import { ApiPropertyOptional } from '@nestjs/swagger';
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

export class UpdateExpenseDto {
  @ApiPropertyOptional({ enum: ExpenseCategory })
  @IsOptional()
  @IsEnum(ExpenseCategory)
  readonly category?: ExpenseCategory;

  @ApiPropertyOptional({ description: 'Description of the expense' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  readonly description?: string;

  @ApiPropertyOptional({ description: 'Expense amount' })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  readonly amount?: number;

  @ApiPropertyOptional({ description: 'Date of the expense (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  readonly date?: string;

  @ApiPropertyOptional({ description: 'Barber ID (null to remove association)' })
  @IsOptional()
  @IsUUID()
  readonly barberId?: string;
}
