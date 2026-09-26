import { Injectable } from '@nestjs/common';
import type { Expense, ExpenseCategory } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';

export interface FindExpensesParams {
  establishmentId: string;
  page?: number;
  pageSize?: number;
  category?: ExpenseCategory;
  barberId?: string;
  startDate?: string;
  endDate?: string;
}

export interface FindExpensesResult {
  data: Expense[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@Injectable()
export class FindExpensesQueryHandler {
  constructor(private readonly prisma: PrismaService) {}

  async execute(params: FindExpensesParams): Promise<FindExpensesResult> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where = {
      establishmentId: params.establishmentId,
      ...(params.barberId ? { barberId: params.barberId } : {}),
      ...(params.category ? { category: params.category } : {}),
      ...(params.startDate || params.endDate
        ? {
            date: {
              ...(params.startDate ? { gte: new Date(params.startDate) } : {}),
              ...(params.endDate ? { lte: new Date(params.endDate) } : {}),
            },
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.expense.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
