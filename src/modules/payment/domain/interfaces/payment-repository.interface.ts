import type { Payment, PaymentMethod, PaymentStatus } from '@prisma/client';

export interface CreatePaymentData {
  appointmentId: string;
  establishmentId: string;
  amount: number;
}

export interface UpdatePaymentData {
  method?: PaymentMethod;
  status?: PaymentStatus;
  tipAmount?: number;
  platformFeeAmount?: number;
  paidAt?: Date;
  refundedAt?: Date;
  refundAmount?: number;
  refundReason?: string;
  notes?: string;
}

export interface FindPaymentsFilter {
  establishmentId?: string;
  status?: PaymentStatus;
  method?: PaymentMethod;
  startDate?: Date;
  endDate?: Date;
}

export interface FindPaymentsPaginatedParams {
  skip: number;
  limit: number;
  establishmentId?: string;
  status?: PaymentStatus[];
  method?: PaymentMethod[];
  startDate?: Date;
  endDate?: Date;
}

export interface PaymentListItem {
  id: string;
  method: PaymentMethod | null;
  status: PaymentStatus;
  tipAmount: number;
  amount: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedPayments {
  data: PaymentListItem[];
  total: number;
}

export interface IPaymentRepository {
  findById(id: string): Promise<Payment | null>;
  findByAppointmentId(appointmentId: string): Promise<Payment | null>;
  findByEstablishment(filters: FindPaymentsFilter): Promise<Payment[]>;
  findAllPaginated(params: FindPaymentsPaginatedParams): Promise<PaginatedPayments>;
  create(data: CreatePaymentData): Promise<Payment>;
  update(id: string, data: UpdatePaymentData): Promise<Payment>;
}

export const PAYMENT_REPOSITORY = Symbol('PAYMENT_REPOSITORY');
