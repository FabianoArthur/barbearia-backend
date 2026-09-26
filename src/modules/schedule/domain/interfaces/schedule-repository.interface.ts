import type { BarberScheduleOverride, BarberTimeOff, BarberWorkingHour } from '@prisma/client';

// Working Hours
export interface CreateWorkingHourData {
  barberId: string;
  weekday: number;
  startTime: string;
  endTime: string;
}

export interface IWorkingHourRepository {
  findByBarberId(barberId: string): Promise<BarberWorkingHour[]>;
  findByBarberAndWeekday(barberId: string, weekday: number): Promise<BarberWorkingHour[]>;
  create(data: CreateWorkingHourData): Promise<BarberWorkingHour>;
  delete(id: string): Promise<void>;
  deleteAllByBarberId(barberId: string): Promise<void>;
}

// Time Off
export interface CreateTimeOffData {
  barberId: string;
  date: Date;
  startTime?: string;
  endTime?: string;
  reason?: string;
}

export interface ITimeOffRepository {
  findByBarberId(barberId: string): Promise<BarberTimeOff[]>;
  findByBarberAndDate(barberId: string, date: Date): Promise<BarberTimeOff[]>;
  create(data: CreateTimeOffData): Promise<BarberTimeOff>;
  delete(id: string): Promise<void>;
}

// Schedule Override
export interface CreateScheduleOverrideData {
  barberId: string;
  startDate: Date;
  endDate: Date;
  weekday?: number;
  startTime: string;
  endTime: string;
  reason?: string;
}

export interface IScheduleOverrideRepository {
  findByBarberId(barberId: string): Promise<BarberScheduleOverride[]>;
  findByBarberAndDateRange(barberId: string, date: Date): Promise<BarberScheduleOverride[]>;
  create(data: CreateScheduleOverrideData): Promise<BarberScheduleOverride>;
  delete(id: string): Promise<void>;
}

export const WORKING_HOUR_REPOSITORY = Symbol('WORKING_HOUR_REPOSITORY');
export const TIME_OFF_REPOSITORY = Symbol('TIME_OFF_REPOSITORY');
export const SCHEDULE_OVERRIDE_REPOSITORY = Symbol('SCHEDULE_OVERRIDE_REPOSITORY');
