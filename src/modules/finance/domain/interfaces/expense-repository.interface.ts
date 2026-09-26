import type { Expense, ExpenseCategory } from '@prisma/client';

export interface CreateExpenseData {
  establishmentId: string;
  barberId?: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: Date;
}

export interface UpdateExpenseData {
  category?: ExpenseCategory;
  description?: string;
  amount?: number;
  date?: Date;
  barberId?: string | null;
}

export interface FindExpensesFilter {
  establishmentId?: string;
  barberId?: string;
  category?: ExpenseCategory;
  startDate?: Date;
  endDate?: Date;
}

export interface IExpenseRepository {
  findById(id: string): Promise<Expense | null>;
  findByEstablishment(filters: FindExpensesFilter): Promise<Expense[]>;
  create(data: CreateExpenseData): Promise<Expense>;
  update(id: string, data: UpdateExpenseData): Promise<Expense>;
  delete(id: string): Promise<void>;
}

export const EXPENSE_REPOSITORY = Symbol('EXPENSE_REPOSITORY');
