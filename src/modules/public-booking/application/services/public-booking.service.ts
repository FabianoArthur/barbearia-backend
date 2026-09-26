import { Inject, Injectable, Logger } from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { DomainError, DomainErrorCode } from '../../../../common/errors';
import { generateAppointmentCode } from '../../../../common/utils/generate-code';
import { isValidClientName } from '../../../../common/validators/name.validator';
import {
  isValidBrazilianPhone,
  normalizePhoneE164,
} from '../../../../common/validators/phone.validator';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { AppointmentService } from '../../../appointment/application/services/appointment.service';
import { ACTIVE_STATUSES } from '../../../appointment/domain/appointment-status-machine';
import {
  APPOINTMENT_REPOSITORY,
  type IAppointmentRepository,
} from '../../../appointment/domain/interfaces/appointment-repository.interface';
import { BarberService } from '../../../barber/application/services/barber.service';
import { ClientService } from '../../../client/application/services/client.service';
import { ReminderProducer } from '../../../notification/infrastructure/queues/reminder.producer';
import { ServiceService } from '../../../service/application/services/service.service';
import type { CreatePublicAppointmentDto } from '../../presentation/dtos/create-public-appointment.dto';

const CONFIRMABLE_STATUSES: readonly AppointmentStatus[] = [
  AppointmentStatus.SCHEDULED,
  AppointmentStatus.CONFIRMATION_PENDING,
];

@Injectable()
export class PublicBookingService {
  private readonly logger = new Logger(PublicBookingService.name);

  constructor(
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepository: IAppointmentRepository,
    private readonly appointmentService: AppointmentService,
    private readonly serviceService: ServiceService,
    private readonly clientService: ClientService,
    private readonly barberService: BarberService,
    private readonly reminderProducer: ReminderProducer,
    private readonly prisma: PrismaService,
  ) {}

  async createPublicAppointment(dto: CreatePublicAppointmentDto) {
    this.validatePublicBookingInput(dto);

    const service = await this.serviceService.findById(dto.serviceId);
    const barber = await this.barberService.findByIdWithEstablishment(dto.barberId);

    this.assertBarberBelongsToEstablishment(barber.establishmentId, dto.establishmentId);
    await this.assertBarberOffersService(dto.barberId, dto.serviceId);

    const client = await this.clientService.findOrCreate(
      dto.establishmentId,
      dto.clientName,
      dto.clientCpf,
      dto.clientPhone,
    );

    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(startsAt.getTime() + service.durationMinutes * 60 * 1000);

    const priceSnapshot = service.price;
    const barberAmountSnapshot = (priceSnapshot * barber.commissionPercent) / 100;
    const establishmentAmountSnapshot = priceSnapshot - barberAmountSnapshot;

    const code = generateAppointmentCode();

    const appointment = await this.appointmentRepository.createWithConflictCheck({
      code,
      establishmentId: dto.establishmentId,
      barberId: dto.barberId,
      clientId: client.id,
      serviceId: dto.serviceId,
      startsAt,
      endsAt,
      priceSnapshot,
      barberAmountSnapshot,
      establishmentAmountSnapshot,
      addressSnapshot: barber.establishment?.address ?? null,
    });

    await this.reminderProducer.scheduleReminder(appointment.id, startsAt);

    return { appointmentId: appointment.id, code };
  }

  async confirmByCode(code: string): Promise<{ confirmed: true }> {
    const appointment = await this.findActiveByCode(code);

    if (!CONFIRMABLE_STATUSES.includes(appointment.status)) {
      throw DomainError.badRequest(
        DomainErrorCode.BOOKING_INVALID_TRANSITION,
        'Appointment cannot be confirmed at this time',
      );
    }

    if (appointment.startsAt < new Date()) {
      throw DomainError.badRequest(
        DomainErrorCode.BOOKING_EXPIRED,
        'Appointment has already passed',
      );
    }

    await this.appointmentService.transitionStatus(
      appointment.id,
      AppointmentStatus.CONFIRMED,
      'PUBLIC',
    );

    this.logger.log(`Appointment ${appointment.id} confirmed by code`);
    return { confirmed: true };
  }

  async cancelByCode(code: string): Promise<{ cancelled: true }> {
    const appointment = await this.findActiveByCode(code);

    if (!ACTIVE_STATUSES.includes(appointment.status)) {
      throw DomainError.badRequest(
        DomainErrorCode.BOOKING_INVALID_TRANSITION,
        'Appointment cannot be cancelled at this time',
      );
    }

    await this.appointmentService.transitionStatus(
      appointment.id,
      AppointmentStatus.CANCELED,
      'PUBLIC',
    );

    this.logger.log(`Appointment ${appointment.id} cancelled by code`);
    return { cancelled: true };
  }

  async rescheduleByCode(
    code: string,
    newStartsAt: string,
  ): Promise<{ appointmentId: string; code: string }> {
    const appointment = await this.findActiveByCode(code);

    if (!ACTIVE_STATUSES.includes(appointment.status)) {
      throw DomainError.badRequest(
        DomainErrorCode.BOOKING_INVALID_TRANSITION,
        'Appointment cannot be rescheduled at this time',
      );
    }

    const service = await this.serviceService.findById(appointment.serviceId);
    const barber = await this.barberService.findByIdWithEstablishment(appointment.barberId);

    const startsAt = new Date(newStartsAt);
    const endsAt = new Date(startsAt.getTime() + service.durationMinutes * 60 * 1000);

    if (startsAt < new Date()) {
      throw DomainError.badRequest(
        DomainErrorCode.BOOKING_EXPIRED,
        'Cannot reschedule to a past time',
      );
    }

    // Cancel old appointment
    await this.appointmentService.transitionStatus(
      appointment.id,
      AppointmentStatus.CANCELED,
      'PUBLIC_RESCHEDULE',
    );

    const priceSnapshot = service.price;
    const barberAmountSnapshot = (priceSnapshot * barber.commissionPercent) / 100;
    const establishmentAmountSnapshot = priceSnapshot - barberAmountSnapshot;

    const newCode = generateAppointmentCode();

    // Create new appointment with conflict check
    const newAppointment = await this.appointmentRepository.createWithConflictCheck({
      code: newCode,
      establishmentId: appointment.establishmentId,
      barberId: appointment.barberId,
      clientId: appointment.clientId,
      serviceId: appointment.serviceId,
      startsAt,
      endsAt,
      priceSnapshot,
      barberAmountSnapshot,
      establishmentAmountSnapshot,
      addressSnapshot: barber.establishment?.address ?? null,
    });

    await this.reminderProducer.scheduleReminder(newAppointment.id, startsAt);

    this.logger.log(`Appointment ${appointment.id} rescheduled -> ${newAppointment.id} by code`);

    return { appointmentId: newAppointment.id, code: newCode };
  }

  private async findActiveByCode(code: string) {
    const appointment = await this.appointmentRepository.findByCode(code);

    if (!appointment) {
      throw DomainError.notFound(DomainErrorCode.BOOKING_NOT_FOUND, 'Appointment not found');
    }

    return appointment;
  }

  private assertBarberBelongsToEstablishment(
    actualEstablishmentId: string,
    expectedEstablishmentId: string,
  ): void {
    if (actualEstablishmentId !== expectedEstablishmentId) {
      throw DomainError.badRequest(
        DomainErrorCode.VALIDATION_ERROR,
        'Barber does not belong to the specified establishment',
      );
    }
  }

  private async assertBarberOffersService(barberId: string, serviceId: string): Promise<void> {
    const count = await this.prisma.barber.count({
      where: {
        id: barberId,
        services: { some: { id: serviceId } },
      },
    });

    if (count === 0) {
      throw DomainError.badRequest(
        DomainErrorCode.BARBER_DOES_NOT_OFFER_SERVICE,
        'Barber does not offer the selected service',
      );
    }
  }

  private validatePublicBookingInput(dto: CreatePublicAppointmentDto): void {
    if (!isValidClientName(dto.clientName)) {
      throw DomainError.badRequest(
        DomainErrorCode.INVALID_NAME,
        'Name must have at least 2 words and cannot contain junk patterns',
      );
    }

    if (dto.clientPhone) {
      if (!isValidBrazilianPhone(dto.clientPhone)) {
        throw DomainError.badRequest(
          DomainErrorCode.INVALID_PHONE,
          'Phone number must be a valid Brazilian phone number',
        );
      }
      dto.clientPhone = normalizePhoneE164(dto.clientPhone);
    }

    const startsAt = new Date(dto.startsAt);
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);

    if (startsAt > maxDate) {
      throw DomainError.badRequest(
        DomainErrorCode.DATE_TOO_FAR,
        'Cannot book more than 30 days in the future',
      );
    }

    if (startsAt < new Date()) {
      throw DomainError.badRequest(DomainErrorCode.BOOKING_EXPIRED, 'Cannot book in the past');
    }
  }
}
