import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Expense } from '@prisma/client';

export class ExpenseResponseDto {
  @ApiProperty({ example: 'uuid' })
  readonly id: string;

  @ApiProperty({ example: 'uuid' })
  readonly establishmentId: string;

  @ApiPropertyOptional({ example: 'uuid', nullable: true })
  readonly barberId: string | null;

  @ApiProperty({ example: 'SUPPLIES' })
  readonly category: string;

  @ApiProperty({ example: 'Shaving cream restock' })
  readonly description: string;

  @ApiProperty({ example: 150.0 })
  readonly amount: number;

  @ApiProperty({ example: '2026-02-10T00:00:00Z' })
  readonly date: Date;

  @ApiProperty()
  readonly createdAt: Date;

  @ApiProperty()
  readonly updatedAt: Date;

  constructor(expense: Expense) {
    this.id = expense.id;
    this.establishmentId = expense.establishmentId;
    this.barberId = expense.barberId;
    this.category = expense.category;
    this.description = expense.description;
    this.amount = expense.amount;
    this.date = expense.date;
    this.createdAt = expense.createdAt;
    this.updatedAt = expense.updatedAt;
  }

  static fromDomain(expense: Expense): ExpenseResponseDto {
    return new ExpenseResponseDto(expense);
  }

  static fromDomainList(expenses: Expense[]): ExpenseResponseDto[] {
    return expenses.map((e) => new ExpenseResponseDto(e));
  }
}
