import { Inject, Injectable } from '@nestjs/common';
import { DomainError, DomainErrorCode } from '../../../../common/errors';
import {
  dateToLocalMinutes,
  formatLocalDate,
  type TimePeriod,
  timeToMinutes,
} from '../../../../common/utils/time.utils';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import {
  type ActiveAppointmentSlot,
  APPOINTMENT_REPOSITORY,
  type IAppointmentRepository,
} from '../../../appointment/domain/interfaces/appointment-repository.interface';
import { BarberService } from '../../../barber/application/services/barber.service';
import {
  ScheduleService,
  type TimeSlot,
} from '../../../schedule/application/services/schedule.service';
import { ServiceService } from '../../../service/application/services/service.service';

export interface AvailabilityResult {
  slots: TimePeriod[];
  serviceDurationMinutes: number;
  workingPeriods: TimePeriod[];
}

@Injectable()
export class GetAvailabilityQueryHandler {
  constructor(
    private readonly scheduleService: ScheduleService,
    private readonly serviceService: ServiceService,
    private readonly barberService: BarberService,
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepository: IAppointmentRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(barberId: string, date: string, serviceId: string): Promise<AvailabilityResult> {
    const service = await this.serviceService.findById(serviceId);
    await this.barberService.findById(barberId);

    const barberOffersService = await this.prisma.barber.count({
      where: {
        id: barberId,
        services: { some: { id: serviceId } },
      },
    });

    if (barberOffersService === 0) {
      throw DomainError.badRequest(
        DomainErrorCode.BARBER_DOES_NOT_OFFER_SERVICE,
        'Barber does not offer the selected service',
      );
    }

    const targetDate = new Date(date);
    const workingPeriods = await this.scheduleService.getEffectiveWorkingPeriods(
      barberId,
      targetDate,
    );

    const slots = await this.scheduleService.getAvailableSlots(
      barberId,
      targetDate,
      service.durationMinutes,
    );

    if (slots.length === 0) {
      return { slots: [], serviceDurationMinutes: service.durationMinutes, workingPeriods };
    }

    const now = new Date();
    const activeAppointments = await this.appointmentRepository.findActiveByBarberAndDate(
      barberId,
      targetDate,
    );
    const isToday = date === formatLocalDate(now);

    const availableSlots = slots.filter((slot) => {
      if (isToday && this.isSlotInPast(slot, now)) {
        return false;
      }

      return !this.slotConflictsWithAppointments(slot, activeAppointments);
    });

    return {
      slots: availableSlots,
      serviceDurationMinutes: service.durationMinutes,
      workingPeriods,
    };
  }

  private isSlotInPast(slot: TimeSlot, now: Date): boolean {
    const nowMinutes = dateToLocalMinutes(now);
    const slotStart = timeToMinutes(slot.startTime);
    return slotStart < nowMinutes;
  }

  private slotConflictsWithAppointments(
    slot: TimeSlot,
    appointments: ActiveAppointmentSlot[],
  ): boolean {
    const slotStart = timeToMinutes(slot.startTime);
    const slotEnd = timeToMinutes(slot.endTime);

    return appointments.some((appt) => {
      const apptStart = dateToLocalMinutes(appt.startsAt);
      const apptEnd = dateToLocalMinutes(appt.endsAt);
      return slotStart < apptEnd && apptStart < slotEnd;
    });
  }
}
