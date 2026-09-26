import { Injectable } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { DomainError, DomainErrorCode } from '../../../../common/errors';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';

export interface FindRefundsParams {
  establishmentId?: string;
  page?: number;
  pageSize?: number;
}

export interface FindRefundsResult {
  data: Array<{
    id: string;
    appointmentId: string;
    amount: number;
    refundAmount: number | null;
    refundReason: string | null;
    refundedAt: Date | null;
    appointment: {
      id: string;
      barberId: string;
      clientId: string;
      startsAt: Date;
      status: string;
    };
  }>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@Injectable()
export class FindRefundsQueryHandler {
  constructor(private readonly prisma: PrismaService) {}

  async execute(params: FindRefundsParams): Promise<FindRefundsResult> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where = {
      status: PaymentStatus.REFUNDED,
      ...(params.establishmentId && {
        establishmentId: params.establishmentId,
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { refundedAt: 'desc' },
        include: {
          appointment: {
            select: {
              id: true,
              barberId: true,
              clientId: true,
              startsAt: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findById(id: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, status: PaymentStatus.REFUNDED },
      include: {
        appointment: {
          include: {
            barber: {
              include: {
                user: { select: { name: true } },
              },
            },
            client: { select: { name: true } },
            service: { select: { name: true } },
          },
        },
      },
    });

    if (!payment) {
      throw DomainError.notFound(
        DomainErrorCode.PAYMENT_NOT_FOUND,
        `Refunded payment ${id} not found`,
      );
    }

    return payment;
  }
}
