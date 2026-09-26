import type { Appointment, AppointmentStatus } from '@prisma/client';

export type StatusFilter = AppointmentStatus | 'LATE';

export interface ActiveAppointmentSlot {
  startsAt: Date;
  endsAt: Date;
}

export interface CreateAppointmentData {
  code: string;
  establishmentId: string;
  barberId: string;
  clientId: string;
  serviceId: string;
  startsAt: Date;
  endsAt: Date;
  priceSnapshot: number;
  barberAmountSnapshot: number;
  establishmentAmountSnapshot: number;
  addressSnapshot?: string | null;
}

export interface AppointmentWithRelations extends Appointment {
  barber: { id: string; user: { name: string } };
  client: { id: string; name: string; cpf: string; phone: string | null };
  service: { name: string; durationMinutes: number };
}

export interface TransitionStatusData {
  status: AppointmentStatus;
  confirmedAt?: Date;
  startedAt?: Date;
  finishedAt?: Date;
  confirmationSentAt?: Date;
}

export interface FindAllPaginatedParams {
  skip: number;
  limit: number;
  establishmentId?: string;
  barberId?: string;
  startDate?: Date;
  endDate?: Date;
  status?: StatusFilter[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface PaginatedAppointments {
  data: AppointmentWithRelations[];
  total: number;
  totalRevenue: number;
}

export interface AppointmentListItem {
  id: string;
  barberName: string;
  barberId: string;
  date: Date;
  clientName: string;
  clientId: string;
  serviceName: string;
  serviceId: string;
  serviceValue: number;
  status: AppointmentStatus;
}

export interface PaginatedAppointmentList {
  data: AppointmentListItem[];
  total: number;
  totalRevenue: number;
}

export interface IAppointmentRepository {
  findAll(): Promise<AppointmentWithRelations[]>;
  findAllPaginated(params: FindAllPaginatedParams): Promise<PaginatedAppointments>;
  findAllPaginatedLean(params: FindAllPaginatedParams): Promise<PaginatedAppointmentList>;
  findById(id: string): Promise<AppointmentWithRelations | null>;
  findByCode(code: string): Promise<AppointmentWithRelations | null>;
  findByEstablishment(
    establishmentId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<AppointmentWithRelations[]>;
  findByBarber(
    barberId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<AppointmentWithRelations[]>;
  findByClient(clientId: string): Promise<AppointmentWithRelations[]>;
  findActiveByBarberAndDate(barberId: string, date: Date): Promise<ActiveAppointmentSlot[]>;
  findActiveByBarberAndDateRange(
    barberId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ActiveAppointmentSlot[]>;
  findConflicting(
    barberId: string,
    startsAt: Date,
    endsAt: Date,
    excludeId?: string,
  ): Promise<Appointment[]>;
  createWithConflictCheck(data: CreateAppointmentData): Promise<Appointment>;
  create(data: CreateAppointmentData): Promise<Appointment>;
  updateStatus(id: string, status: AppointmentStatus): Promise<Appointment>;
  transitionStatus(id: string, data: TransitionStatusData): Promise<Appointment>;
  findPendingConfirmation(windowStart: Date, windowEnd: Date): Promise<AppointmentWithRelations[]>;
  atomicSetConfirmationPending(id: string): Promise<boolean>;
  updateWhatsAppInfo(id: string, messageId: string, status: string): Promise<void>;
  clearConfirmationSentAt(id: string): Promise<void>;
  delete(id: string): Promise<void>;
  updateReminderSentAt(id: string, messageSid: string): Promise<void>;
  findMissedReminders(
    windowStart: Date,
    windowEnd: Date,
  ): Promise<{ id: string; startsAt: Date }[]>;
  createAuditLog(data: {
    appointmentId: string;
    fromStatus: AppointmentStatus;
    toStatus: AppointmentStatus;
    changedBy: string | null;
  }): Promise<void>;
}

export const APPOINTMENT_REPOSITORY = Symbol('APPOINTMENT_REPOSITORY');
