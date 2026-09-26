import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  EXPENSE_REPOSITORY,
  type FindExpensesFilter,
  type IExpenseRepository,
} from '../../domain/interfaces/expense-repository.interface';
import type { CreateExpenseDto } from '../../presentation/dtos/create-expense.dto';
import type { UpdateExpenseDto } from '../../presentation/dtos/update-expense.dto';

@Injectable()
export class ExpenseService {
  constructor(
    @Inject(EXPENSE_REPOSITORY)
    private readonly expenseRepository: IExpenseRepository,
  ) {}

  async create(establishmentId: string, dto: CreateExpenseDto) {
    return this.expenseRepository.create({
      establishmentId,
      barberId: dto.barberId,
      category: dto.category,
      description: dto.description,
      amount: dto.amount,
      date: new Date(dto.date),
    });
  }

  async update(id: string, dto: UpdateExpenseDto) {
    await this.findByIdOrThrow(id);
    return this.expenseRepository.update(id, {
      ...dto,
      date: dto.date ? new Date(dto.date) : undefined,
    });
  }

  async delete(id: string) {
    await this.findByIdOrThrow(id);
    await this.expenseRepository.delete(id);
  }

  async findByEstablishment(filters: FindExpensesFilter) {
    return this.expenseRepository.findByEstablishment(filters);
  }

  async findById(id: string) {
    return this.findByIdOrThrow(id);
  }

  private async findByIdOrThrow(id: string) {
    const expense = await this.expenseRepository.findById(id);
    if (!expense) {
      throw new NotFoundException(`Expense ${id} not found`);
    }
    return expense;
  }
}
