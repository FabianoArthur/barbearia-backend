import { Injectable } from '@nestjs/common';
import type { Payment, Prisma } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import type {
  CreatePaymentData,
  FindPaymentsFilter,
  FindPaymentsPaginatedParams,
  IPaymentRepository,
  PaginatedPayments,
  UpdatePaymentData,
} from '../../domain/interfaces/payment-repository.interface';

const LEAN_SELECT = {
  id: true,
  method: true,
  status: true,
  tipAmount: true,
  amount: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class PrismaPaymentRepository implements IPaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Payment | null> {
    return this.prisma.payment.findUnique({ where: { id } });
  }

  async findByAppointmentId(appointmentId: string): Promise<Payment | null> {
    return this.prisma.payment.findUnique({ where: { appointmentId } });
  }

  async findByEstablishment(filters: FindPaymentsFilter): Promise<Payment[]> {
    return this.prisma.payment.findMany({
      where: {
        ...(filters.establishmentId ? { establishmentId: filters.establishmentId } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.method ? { method: filters.method } : {}),
        ...(filters.startDate || filters.endDate
          ? {
              createdAt: {
                ...(filters.startDate ? { gte: filters.startDate } : {}),
                ...(filters.endDate ? { lte: filters.endDate } : {}),
              },
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllPaginated(params: FindPaymentsPaginatedParams): Promise<PaginatedPayments> {
    const where = this.buildPaginatedWhere(params);

    const [rows, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        select: LEAN_SELECT,
        orderBy: { createdAt: 'desc' },
        skip: params.skip,
        take: params.limit,
      }),
      this.prisma.payment.count({ where }),
    ]);

    return { data: rows, total };
  }

  async create(data: CreatePaymentData): Promise<Payment> {
    return this.prisma.payment.create({ data });
  }

  async update(id: string, data: UpdatePaymentData): Promise<Payment> {
    return this.prisma.payment.update({ where: { id }, data });
  }

  private buildPaginatedWhere(params: FindPaymentsPaginatedParams): Prisma.PaymentWhereInput {
    const where: Prisma.PaymentWhereInput = {};

    if (params.establishmentId) {
      where.establishmentId = params.establishmentId;
    }

    if (params.status?.length) {
      where.status = { in: params.status };
    }

    if (params.method?.length) {
      where.method = { in: params.method };
    }

    if (params.startDate || params.endDate) {
      where.createdAt = {
        ...(params.startDate ? { gte: params.startDate } : {}),
        ...(params.endDate ? { lte: params.endDate } : {}),
      };
    }

    return where;
  }
}
