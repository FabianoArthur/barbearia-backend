import { Inject, Injectable } from '@nestjs/common';
import {
  minutesToTime,
  subtractTimeRange,
  type TimePeriod,
  timeToMinutes,
} from '../../../../common/utils/time.utils';
import {
  type IScheduleOverrideRepository,
  type ITimeOffRepository,
  type IWorkingHourRepository,
  SCHEDULE_OVERRIDE_REPOSITORY,
  TIME_OFF_REPOSITORY,
  WORKING_HOUR_REPOSITORY,
} from '../../domain/interfaces/schedule-repository.interface';
import type { CreateScheduleOverrideDto } from '../../presentation/dtos/create-schedule-override.dto';
import type { CreateTimeOffDto } from '../../presentation/dtos/create-time-off.dto';
import type { CreateWorkingHourDto } from '../../presentation/dtos/create-working-hour.dto';

export type TimeSlot = TimePeriod;

const SLOT_STEP_MINUTES = 5;

@Injectable()
export class ScheduleService {
  constructor(
    @Inject(WORKING_HOUR_REPOSITORY)
    private readonly workingHourRepo: IWorkingHourRepository,
    @Inject(TIME_OFF_REPOSITORY)
    private readonly timeOffRepo: ITimeOffRepository,
    @Inject(SCHEDULE_OVERRIDE_REPOSITORY)
    private readonly scheduleOverrideRepo: IScheduleOverrideRepository,
  ) {}

  // --- Working Hours ---

  async getWorkingHours(barberId: string) {
    return this.workingHourRepo.findByBarberId(barberId);
  }

  async createWorkingHour(dto: CreateWorkingHourDto) {
    return this.workingHourRepo.create(dto);
  }

  async deleteWorkingHour(id: string) {
    return this.workingHourRepo.delete(id);
  }

  async replaceWorkingHours(barberId: string, hours: CreateWorkingHourDto[]) {
    await this.workingHourRepo.deleteAllByBarberId(barberId);
    return Promise.all(hours.map((h) => this.workingHourRepo.create(h)));
  }

  // --- Time Off ---

  async getTimeOffs(barberId: string) {
    return this.timeOffRepo.findByBarberId(barberId);
  }

  async createTimeOff(dto: CreateTimeOffDto) {
    return this.timeOffRepo.create({
      ...dto,
      date: new Date(dto.date),
    });
  }

  async deleteTimeOff(id: string) {
    return this.timeOffRepo.delete(id);
  }

  // --- Schedule Override ---

  async getScheduleOverrides(barberId: string) {
    return this.scheduleOverrideRepo.findByBarberId(barberId);
  }

  async createScheduleOverride(dto: CreateScheduleOverrideDto) {
    return this.scheduleOverrideRepo.create({
      ...dto,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
    });
  }

  async deleteScheduleOverride(id: string) {
    return this.scheduleOverrideRepo.delete(id);
  }

  // --- Effective Working Periods ---

  /**
   * Returns the effective working periods for a barber on a specific date,
   * considering schedule overrides and time offs (both full-day and partial).
   */
  async getEffectiveWorkingPeriods(barberId: string, date: Date): Promise<TimeSlot[]> {
    const weekday = date.getUTCDay();

    // 1. Check time off blocks
    const timeOffs = await this.timeOffRepo.findByBarberAndDate(barberId, date);
    const fullDayOff = timeOffs.some((t) => !t.startTime && !t.endTime);
    if (fullDayOff) {
      return [];
    }

    // 2. Base working periods from weekly hours
    const defaultHours = await this.workingHourRepo.findByBarberAndWeekday(barberId, weekday);
    if (defaultHours.length === 0) {
      return [];
    }
    let workingPeriods: TimeSlot[] = defaultHours.map((h) => ({
      startTime: h.startTime,
      endTime: h.endTime,
    }));

    // 3. Subtract schedule override (exception) ranges from working periods
    const overrides = await this.scheduleOverrideRepo.findByBarberAndDateRange(barberId, date);
    const applicableOverrides = overrides.filter(
      (o) => o.weekday === null || o.weekday === weekday,
    );
    for (const override of applicableOverrides) {
      workingPeriods = subtractTimeRange(workingPeriods, override.startTime, override.endTime);
    }

    // 4. Subtract partial time off ranges from working periods
    const partialTimeOffs = timeOffs.filter((t) => t.startTime && t.endTime);
    for (const timeOff of partialTimeOffs) {
      if (timeOff.startTime && timeOff.endTime) {
        workingPeriods = subtractTimeRange(workingPeriods, timeOff.startTime, timeOff.endTime);
      }
    }

    return workingPeriods;
  }

  // --- Availability Calculation ---

  async getAvailableSlots(
    barberId: string,
    date: Date,
    durationMinutes: number,
  ): Promise<TimeSlot[]> {
    const workingPeriods = await this.getEffectiveWorkingPeriods(barberId, date);
    if (workingPeriods.length === 0) {
      return [];
    }

    const slots: TimeSlot[] = [];
    for (const period of workingPeriods) {
      const periodSlots = this.generateSlotsForPeriod(
        period.startTime,
        period.endTime,
        durationMinutes,
      );
      slots.push(...periodSlots);
    }

    return slots;
  }

  private generateSlotsForPeriod(
    startTime: string,
    endTime: string,
    durationMinutes: number,
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    let currentMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);

    while (currentMinutes + durationMinutes <= endMinutes) {
      slots.push({
        startTime: minutesToTime(currentMinutes),
        endTime: minutesToTime(currentMinutes + durationMinutes),
      });
      currentMinutes += SLOT_STEP_MINUTES;
    }

    return slots;
  }
}
