import { Injectable } from '@nestjs/common';
import type { Expense } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import type {
  CreateExpenseData,
  FindExpensesFilter,
  IExpenseRepository,
  UpdateExpenseData,
} from '../../domain/interfaces/expense-repository.interface';

@Injectable()
export class PrismaExpenseRepository implements IExpenseRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Expense | null> {
    return this.prisma.expense.findUnique({ where: { id } });
  }

  async findByEstablishment(filters: FindExpensesFilter): Promise<Expense[]> {
    return this.prisma.expense.findMany({
      where: {
        ...(filters.establishmentId ? { establishmentId: filters.establishmentId } : {}),
        ...(filters.barberId ? { barberId: filters.barberId } : {}),
        ...(filters.category ? { category: filters.category } : {}),
        ...(filters.startDate || filters.endDate
          ? {
              date: {
                ...(filters.startDate ? { gte: filters.startDate } : {}),
                ...(filters.endDate ? { lte: filters.endDate } : {}),
              },
            }
          : {}),
      },
      orderBy: { date: 'desc' },
    });
  }

  async create(data: CreateExpenseData): Promise<Expense> {
    return this.prisma.expense.create({ data });
  }

  async update(id: string, data: UpdateExpenseData): Promise<Expense> {
    return this.prisma.expense.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.expense.delete({ where: { id } });
  }
}
