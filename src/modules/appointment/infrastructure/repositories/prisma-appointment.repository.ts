import { ConflictException, Injectable } from '@nestjs/common';
import { type Appointment, AppointmentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { ACTIVE_STATUSES, LATE_ELIGIBLE_STATUSES } from '../../domain/appointment-status-machine';
import type {
  ActiveAppointmentSlot,
  AppointmentListItem,
  AppointmentWithRelations,
  CreateAppointmentData,
  FindAllPaginatedParams,
  IAppointmentRepository,
  PaginatedAppointmentList,
  PaginatedAppointments,
  TransitionStatusData,
} from '../../domain/interfaces/appointment-repository.interface';

const includeRelations = {
  barber: { include: { user: { select: { name: true } } } },
  client: { select: { id: true, name: true, cpf: true, phone: true } },
  service: { select: { name: true, durationMinutes: true } },
} as const;

@Injectable()
export class PrismaAppointmentRepository implements IAppointmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<AppointmentWithRelations[]> {
    return this.prisma.appointment.findMany({
      where: { deletedAt: null },
      include: includeRelations,
    }) as Promise<AppointmentWithRelations[]>;
  }

  async findAllPaginated(params: FindAllPaginatedParams): Promise<PaginatedAppointments> {
    const where = this.buildPaginatedWhere(params);

    const [data, total, aggregate] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        include: includeRelations,
        orderBy: { [params.sortBy]: params.sortOrder },
        skip: params.skip,
        take: params.limit,
      }),
      this.prisma.appointment.count({ where }),
      this.prisma.appointment.aggregate({
        where,
        _sum: { priceSnapshot: true },
      }),
    ]);

    return {
      data: data as AppointmentWithRelations[],
      total,
      totalRevenue: aggregate._sum.priceSnapshot ?? 0,
    };
  }

  async findAllPaginatedLean(params: FindAllPaginatedParams): Promise<PaginatedAppointmentList> {
    const where = this.buildPaginatedWhere(params);

    const leanSelect = {
      id: true,
      barberId: true,
      clientId: true,
      serviceId: true,
      startsAt: true,
      status: true,
      priceSnapshot: true,
      barber: { select: { id: true, user: { select: { name: true } } } },
      client: { select: { id: true, name: true } },
      service: { select: { id: true, name: true } },
    } as const;

    const [rows, total, aggregate] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        select: leanSelect,
        orderBy: { [params.sortBy]: params.sortOrder },
        skip: params.skip,
        take: params.limit,
      }),
      this.prisma.appointment.count({ where }),
      this.prisma.appointment.aggregate({
        where,
        _sum: { priceSnapshot: true },
      }),
    ]);

    const data: AppointmentListItem[] = rows.map((row) => ({
      id: row.id,
      barberName: row.barber.user.name,
      barberId: row.barberId,
      date: row.startsAt,
      clientName: row.client.name,
      clientId: row.clientId,
      serviceName: row.service.name,
      serviceId: row.serviceId,
      serviceValue: row.priceSnapshot,
      status: row.status,
    }));

    return {
      data,
      total,
      totalRevenue: aggregate._sum.priceSnapshot ?? 0,
    };
  }

  private buildPaginatedWhere(params: FindAllPaginatedParams): Record<string, unknown> {
    const where: Record<string, unknown> = { deletedAt: null };

    if (params.establishmentId) {
      where.establishmentId = params.establishmentId;
    }

    if (params.barberId) {
      where.barberId = params.barberId;
    }

    if (!params.status || params.status.length === 0) {
      this.applyDateRange(where, params);
      return where;
    }

    const hasLate = params.status.includes('LATE');
    const realStatuses = params.status.filter((s): s is AppointmentStatus => s !== 'LATE');

    if (hasLate && realStatuses.length === 0) {
      this.applyLateFilter(where, params);
    } else if (hasLate) {
      const dateRange = this.buildDateRange(params);
      const lateCondition: Record<string, unknown> = {
        status: { in: [...LATE_ELIGIBLE_STATUSES] },
        startsAt: { lt: new Date(), ...dateRange },
        startedAt: null,
      };
      const statusCondition: Record<string, unknown> = {
        status: { in: realStatuses },
        ...(Object.keys(dateRange).length > 0 ? { startsAt: dateRange } : {}),
      };
      where.OR = [lateCondition, statusCondition];
    } else {
      where.status = { in: realStatuses };
      this.applyDateRange(where, params);
    }

    return where;
  }

  private applyLateFilter(where: Record<string, unknown>, params: FindAllPaginatedParams): void {
    where.status = { in: [...LATE_ELIGIBLE_STATUSES] };
    where.startsAt = {
      lt: new Date(),
      ...(params.startDate ? { gte: params.startDate } : {}),
      ...(params.endDate ? { lte: params.endDate } : {}),
    };
    where.startedAt = null;
  }

  private applyDateRange(where: Record<string, unknown>, params: FindAllPaginatedParams): void {
    if (params.startDate || params.endDate) {
      where.startsAt = this.buildDateRange(params);
    }
  }

  private buildDateRange(params: FindAllPaginatedParams): Record<string, Date> {
    const range: Record<string, Date> = {};
    if (params.startDate) range.gte = params.startDate;
    if (params.endDate) range.lte = params.endDate;
    return range;
  }

  async findById(id: string): Promise<AppointmentWithRelations | null> {
    return this.prisma.appointment.findFirst({
      where: { id, deletedAt: null },
      include: includeRelations,
    }) as Promise<AppointmentWithRelations | null>;
  }

  async findByCode(code: string): Promise<AppointmentWithRelations | null> {
    return this.prisma.appointment.findFirst({
      where: { code, deletedAt: null },
      include: includeRelations,
    }) as Promise<AppointmentWithRelations | null>;
  }

  async findByEstablishment(
    establishmentId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<AppointmentWithRelations[]> {
    return this.prisma.appointment.findMany({
      where: {
        establishmentId,
        deletedAt: null,
        ...(startDate && endDate ? { startsAt: { gte: startDate, lte: endDate } } : {}),
      },
      include: includeRelations,
      orderBy: { startsAt: 'asc' },
    }) as Promise<AppointmentWithRelations[]>;
  }

  async findByBarber(
    barberId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<AppointmentWithRelations[]> {
    return this.prisma.appointment.findMany({
      where: {
        barberId,
        deletedAt: null,
        ...(startDate && endDate ? { startsAt: { gte: startDate, lte: endDate } } : {}),
      },
      include: includeRelations,
      orderBy: { startsAt: 'asc' },
    }) as Promise<AppointmentWithRelations[]>;
  }

  async findByClient(clientId: string): Promise<AppointmentWithRelations[]> {
    return this.prisma.appointment.findMany({
      where: { clientId, deletedAt: null },
      include: includeRelations,
      orderBy: { startsAt: 'desc' },
    }) as Promise<AppointmentWithRelations[]>;
  }

  async findActiveByBarberAndDate(barberId: string, date: Date): Promise<ActiveAppointmentSlot[]> {
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    return this.prisma.appointment.findMany({
      where: {
        barberId,
        deletedAt: null,
        status: { in: [...ACTIVE_STATUSES] },
        startsAt: { gte: startOfDay, lte: endOfDay },
      },
      select: { startsAt: true, endsAt: true },
      orderBy: { startsAt: 'asc' },
    });
  }

  async findActiveByBarberAndDateRange(
    barberId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ActiveAppointmentSlot[]> {
    const rangeStart = new Date(startDate);
    rangeStart.setUTCHours(0, 0, 0, 0);
    const rangeEnd = new Date(endDate);
    rangeEnd.setUTCHours(23, 59, 59, 999);

    return this.prisma.appointment.findMany({
      where: {
        barberId,
        deletedAt: null,
        status: { in: [...ACTIVE_STATUSES] },
        startsAt: { gte: rangeStart, lte: rangeEnd },
      },
      select: { startsAt: true, endsAt: true },
      orderBy: { startsAt: 'asc' },
    });
  }

  async findConflicting(
    barberId: string,
    startsAt: Date,
    endsAt: Date,
    excludeId?: string,
  ): Promise<Appointment[]> {
    return this.prisma.appointment.findMany({
      where: {
        barberId,
        deletedAt: null,
        status: { in: [...ACTIVE_STATUSES] },
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  }

  async createWithConflictCheck(data: CreateAppointmentData): Promise<Appointment> {
    return this.prisma.$transaction(
      async (tx) => {
        const conflicts = await tx.appointment.findMany({
          where: {
            barberId: data.barberId,
            deletedAt: null,
            status: { in: [...ACTIVE_STATUSES] },
            startsAt: { lt: data.endsAt },
            endsAt: { gt: data.startsAt },
          },
          select: { id: true },
          take: 1,
        });

        if (conflicts.length > 0) {
          throw new ConflictException('Time slot conflicts with an existing appointment');
        }

        return tx.appointment.create({ data });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async create(data: CreateAppointmentData): Promise<Appointment> {
    return this.prisma.appointment.create({ data });
  }

  async updateStatus(id: string, status: AppointmentStatus): Promise<Appointment> {
    return this.prisma.appointment.update({
      where: { id },
      data: { status },
    });
  }

  async transitionStatus(id: string, data: TransitionStatusData): Promise<Appointment> {
    return this.prisma.appointment.update({
      where: { id },
      data,
    });
  }

  async findPendingConfirmation(
    windowStart: Date,
    windowEnd: Date,
  ): Promise<AppointmentWithRelations[]> {
    return this.prisma.appointment.findMany({
      where: {
        deletedAt: null,
        status: AppointmentStatus.SCHEDULED,
        confirmationSentAt: null,
        startsAt: { gte: windowStart, lte: windowEnd },
      },
      include: includeRelations,
      orderBy: { startsAt: 'asc' },
    }) as Promise<AppointmentWithRelations[]>;
  }

  async atomicSetConfirmationPending(id: string): Promise<boolean> {
    const result = await this.prisma.appointment.updateMany({
      where: {
        id,
        status: AppointmentStatus.SCHEDULED,
        confirmationSentAt: null,
      },
      data: {
        status: AppointmentStatus.CONFIRMATION_PENDING,
        confirmationSentAt: new Date(),
      },
    });
    return result.count === 1;
  }

  async updateWhatsAppInfo(id: string, messageId: string, status: string): Promise<void> {
    await this.prisma.appointment.update({
      where: { id },
      data: { whatsappMessageId: messageId, whatsappStatus: status },
    });
  }

  async clearConfirmationSentAt(id: string): Promise<void> {
    await this.prisma.appointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.SCHEDULED,
        confirmationSentAt: null,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.appointment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async updateReminderSentAt(id: string, messageSid: string): Promise<void> {
    await this.prisma.appointment.update({
      where: { id },
      data: {
        reminderSentAt: new Date(),
        whatsappMessageId: messageSid,
      },
    });
  }

  async findMissedReminders(
    windowStart: Date,
    windowEnd: Date,
  ): Promise<{ id: string; startsAt: Date }[]> {
    return this.prisma.appointment.findMany({
      where: {
        deletedAt: null,
        status: AppointmentStatus.CONFIRMED,
        reminderSentAt: null,
        startsAt: { gte: windowStart, lte: windowEnd },
      },
      select: { id: true, startsAt: true },
      orderBy: { startsAt: 'asc' },
    });
  }

  async createAuditLog(data: {
    appointmentId: string;
    fromStatus: AppointmentStatus;
    toStatus: AppointmentStatus;
    changedBy: string | null;
  }): Promise<void> {
    await this.prisma.appointmentAuditLog.create({ data });
  }
}
