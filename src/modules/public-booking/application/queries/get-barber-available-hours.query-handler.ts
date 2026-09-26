import { Inject, Injectable } from '@nestjs/common';
import {
  addDaysUTC,
  clipPeriodsAfter,
  dateToLocalTimeString,
  eachDayUTC,
  formatLocalDate,
  subtractTimeRange,
  type TimePeriod,
  toUTCDateOnly,
} from '../../../../common/utils/time.utils';
import {
  type ActiveAppointmentSlot,
  APPOINTMENT_REPOSITORY,
  type IAppointmentRepository,
} from '../../../appointment/domain/interfaces/appointment-repository.interface';
import { ScheduleService } from '../../../schedule/application/services/schedule.service';

export interface AvailableDay {
  date: string;
  weekday: number;
  periods: TimePeriod[];
}

@Injectable()
export class GetBarberAvailableHoursQueryHandler {
  constructor(
    private readonly scheduleService: ScheduleService,
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepository: IAppointmentRepository,
  ) {}

  async execute(barberId: string, startDate?: string, endDate?: string): Promise<AvailableDay[]> {
    const now = new Date();
    const start = startDate ? toUTCDateOnly(new Date(startDate)) : toUTCDateOnly(now);
    const end = endDate ? toUTCDateOnly(new Date(endDate)) : addDaysUTC(start, 7);

    // Batch-fetch all active appointments for the entire date range in one query
    const allAppointments = await this.appointmentRepository.findActiveByBarberAndDateRange(
      barberId,
      start,
      end,
    );

    // Group appointments by LOCAL date string for correct day assignment
    const appointmentsByDate = this.groupAppointmentsByLocalDate(allAppointments);

    const todayLocalDate = formatLocalDate(now);
    const results: AvailableDay[] = [];

    for (const date of eachDayUTC(start, end)) {
      const dateKey = formatLocalDate(date);
      const dayAppointments = appointmentsByDate.get(dateKey) ?? [];
      const availableDay = await this.resolveAvailableDay(
        barberId,
        date,
        now,
        todayLocalDate,
        dayAppointments,
      );
      if (availableDay) {
        results.push(availableDay);
      }
    }

    return results;
  }

  private groupAppointmentsByLocalDate(
    appointments: ActiveAppointmentSlot[],
  ): Map<string, ActiveAppointmentSlot[]> {
    const map = new Map<string, ActiveAppointmentSlot[]>();

    for (const appt of appointments) {
      const dateKey = formatLocalDate(appt.startsAt);
      const existing = map.get(dateKey);
      if (existing) {
        existing.push(appt);
      } else {
        map.set(dateKey, [appt]);
      }
    }

    return map;
  }

  private async resolveAvailableDay(
    barberId: string,
    date: Date,
    now: Date,
    todayLocalDate: string,
    appointments: ActiveAppointmentSlot[],
  ): Promise<AvailableDay | null> {
    let periods = await this.scheduleService.getEffectiveWorkingPeriods(barberId, date);
    if (periods.length === 0) {
      return null;
    }

    // If today, clip periods to current time (remove past hours)
    if (formatLocalDate(date) === todayLocalDate) {
      periods = clipPeriodsAfter(periods, dateToLocalTimeString(now));
      if (periods.length === 0) {
        return null;
      }
    }

    // Subtract each appointment window from working periods (using local time)
    for (const appt of appointments) {
      periods = subtractTimeRange(
        periods,
        dateToLocalTimeString(appt.startsAt),
        dateToLocalTimeString(appt.endsAt),
      );
    }

    if (periods.length === 0) {
      return null;
    }

    return {
      date: formatLocalDate(date),
      weekday: date.getUTCDay(),
      periods,
    };
  }
}
