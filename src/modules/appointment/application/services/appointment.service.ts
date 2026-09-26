import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AppointmentStatus } from '@prisma/client';
import { DomainError, DomainErrorCode } from '../../../../common/errors';
import {
  BookingCreatedEvent,
  BookingDeletedEvent,
  BookingStatusChangedEvent,
} from '../../../../common/events';
import { generateAppointmentCode } from '../../../../common/utils/generate-code';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { ReminderProducer } from '../../../notification/infrastructure/queues/reminder.producer';
import { PaymentService } from '../../../payment/application/services/payment.service';
import { getTimestampField, isValidTransition } from '../../domain/appointment-status-machine';
import {
  APPOINTMENT_REPOSITORY,
  type IAppointmentRepository,
  type TransitionStatusData,
} from '../../domain/interfaces/appointment-repository.interface';
import type { CreateAppointmentDto } from '../../presentation/dtos/create-appointment.dto';

@Injectable()
export class AppointmentService {
  private readonly logger = new Logger(AppointmentService.name);

  constructor(
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepository: IAppointmentRepository,
    private readonly prisma: PrismaService,
    private readonly reminderProducer: ReminderProducer,
    private readonly paymentService: PaymentService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll() {
    return this.appointmentRepository.findAll();
  }

  async findById(id: string) {
    const appointment = await this.appointmentRepository.findById(id);
    if (!appointment) {
      throw DomainError.notFound(DomainErrorCode.BOOKING_NOT_FOUND, 'Appointment not found');
    }
    return appointment;
  }

  async findByEstablishment(establishmentId: string, startDate?: string, endDate?: string) {
    return this.appointmentRepository.findByEstablishment(
      establishmentId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  async findByBarber(barberId: string, startDate?: string, endDate?: string) {
    return this.appointmentRepository.findByBarber(
      barberId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  async findByClient(clientId: string) {
    return this.appointmentRepository.findByClient(clientId);
  }

  async create(dto: CreateAppointmentDto) {
    const service = await this.prisma.service.findFirst({
      where: { id: dto.serviceId, deletedAt: null },
    });
    if (!service) {
      throw DomainError.notFound(DomainErrorCode.SERVICE_NOT_FOUND, 'Service not found');
    }

    const barber = await this.prisma.barber.findUnique({
      where: { id: dto.barberId },
      include: { establishment: { select: { address: true } } },
    });
    if (!barber) {
      throw DomainError.notFound(DomainErrorCode.BARBER_NOT_FOUND, 'Barber not found');
    }

    const barberOffersService = await this.prisma.barber.count({
      where: {
        id: dto.barberId,
        services: { some: { id: dto.serviceId } },
      },
    });

    if (barberOffersService === 0) {
      throw DomainError.badRequest(
        DomainErrorCode.BARBER_DOES_NOT_OFFER_SERVICE,
        'Barber does not offer the selected service',
      );
    }

    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(startsAt.getTime() + service.durationMinutes * 60 * 1000);

    const priceSnapshot = service.price;
    const barberAmountSnapshot = (priceSnapshot * barber.commissionPercent) / 100;
    const establishmentAmountSnapshot = priceSnapshot - barberAmountSnapshot;

    const appointment = await this.appointmentRepository.createWithConflictCheck({
      code: generateAppointmentCode(),
      establishmentId: dto.establishmentId,
      barberId: dto.barberId,
      clientId: dto.clientId,
      serviceId: dto.serviceId,
      startsAt,
      endsAt,
      priceSnapshot,
      barberAmountSnapshot,
      establishmentAmountSnapshot,
      addressSnapshot: barber.establishment.address ?? null,
    });

    await this.reminderProducer.scheduleReminder(appointment.id, startsAt);

    this.eventEmitter.emit(
      BookingCreatedEvent.event,
      new BookingCreatedEvent(
        appointment.id,
        appointment.establishmentId,
        appointment.barberId,
        dto.clientId,
        dto.serviceId,
        appointment.status,
        appointment.priceSnapshot,
        null,
      ),
    );

    return appointment;
  }

  async transitionStatus(id: string, targetStatus: AppointmentStatus, changedBy: string | null) {
    const appointment = await this.findById(id);
    const fromStatus = appointment.status;

    if (!isValidTransition(fromStatus, targetStatus)) {
      throw DomainError.badRequest(
        DomainErrorCode.BOOKING_INVALID_TRANSITION,
        `Cannot transition from ${fromStatus} to ${targetStatus}`,
      );
    }

    const now = new Date();
    const timestampField = getTimestampField(targetStatus);
    const data: TransitionStatusData = { status: targetStatus };

    if (timestampField) {
      data[timestampField] = now;
    }

    const updated = await this.appointmentRepository.transitionStatus(id, data);

    await this.appointmentRepository.createAuditLog({
      appointmentId: id,
      fromStatus,
      toStatus: targetStatus,
      changedBy,
    });

    this.logger.log(
      `Appointment ${id} transitioned: ${fromStatus} -> ${targetStatus} by ${changedBy ?? 'SYSTEM'}`,
    );

    this.eventEmitter.emit(
      BookingStatusChangedEvent.event,
      new BookingStatusChangedEvent(id, fromStatus, targetStatus, changedBy),
    );

    if (targetStatus === AppointmentStatus.CANCELED) {
      await this.reminderProducer.cancelReminder(id);
    }

    if (targetStatus === AppointmentStatus.DONE) {
      await this.paymentService.createPendingPayment({
        id: appointment.id,
        establishmentId: appointment.establishmentId,
        priceSnapshot: appointment.priceSnapshot,
      });
    }

    return updated;
  }

  async delete(id: string): Promise<void> {
    const appointment = await this.findById(id);
    await this.appointmentRepository.delete(id);
    this.logger.log(`Appointment ${id} deleted`);

    this.eventEmitter.emit(
      BookingDeletedEvent.event,
      new BookingDeletedEvent(id, appointment.establishmentId, null),
    );
  }

  /** @deprecated Use transitionStatus instead */
  async updateStatus(id: string, status: AppointmentStatus) {
    return this.transitionStatus(id, status, null);
  }

  async getMetrics(establishmentId: string, startDate?: string, endDate?: string) {
    const dateFilter =
      startDate && endDate
        ? { startsAt: { gte: new Date(startDate), lte: new Date(endDate) } }
        : {};

    const baseWhere = { establishmentId, deletedAt: null, ...dateFilter };

    const [totalAppointments, confirmationSent, confirmed, noShows] = await Promise.all([
      this.prisma.appointment.count({ where: baseWhere }),
      this.prisma.appointment.count({
        where: { ...baseWhere, confirmationSentAt: { not: null } },
      }),
      this.prisma.appointment.count({
        where: {
          ...baseWhere,
          status: {
            in: [
              AppointmentStatus.CONFIRMED,
              AppointmentStatus.IN_PROGRESS,
              AppointmentStatus.DONE,
            ],
          },
        },
      }),
      this.prisma.appointment.count({
        where: { ...baseWhere, status: AppointmentStatus.NO_SHOW },
      }),
    ]);

    // Late starts require comparing two columns, so we use a raw query
    const lateStartCount = await this.countLateStarts(
      establishmentId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );

    return {
      totalAppointments,
      confirmationRate: confirmationSent > 0 ? confirmed / confirmationSent : 0,
      noShowRate: totalAppointments > 0 ? noShows / totalAppointments : 0,
      lateStartRate: totalAppointments > 0 ? lateStartCount / totalAppointments : 0,
      breakdown: {
        confirmationSent,
        confirmed,
        noShows,
        lateStarts: lateStartCount,
      },
    };
  }

  private async countLateStarts(
    establishmentId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<number> {
    if (startDate && endDate) {
      const result = await this.prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM "Appointment"
        WHERE "establishmentId" = ${establishmentId}
        AND "deletedAt" IS NULL
        AND "startedAt" IS NOT NULL
        AND "startedAt" > "startsAt"
        AND "startsAt" >= ${startDate}
        AND "startsAt" <= ${endDate}
      `;
      return Number(result[0]?.count ?? 0);
    }

    const result = await this.prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM "Appointment"
      WHERE "establishmentId" = ${establishmentId}
      AND "deletedAt" IS NULL
      AND "startedAt" IS NOT NULL
      AND "startedAt" > "startsAt"
    `;
    return Number(result[0]?.count ?? 0);
  }
}
