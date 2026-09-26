import type { Barber, Service } from '@prisma/client';

export interface CreateBarberData {
  userId: string;
  establishmentId: string;
  commissionPercent?: number;
  serviceIds?: string[];
}

export interface UpdateBarberData {
  commissionPercent?: number;
  name?: string;
  email?: string;
  serviceIds?: string[];
}

export interface BarberWithUser extends Barber {
  user: { id: string; name: string; email: string };
}

export interface BarberWithServices extends BarberWithUser {
  services: Pick<Service, 'id' | 'name' | 'price' | 'durationMinutes'>[];
}

export interface BarberWithEstablishment extends BarberWithUser {
  establishment: { address: string | null };
}

export interface IBarberRepository {
  findAll(): Promise<BarberWithUser[]>;
  findById(id: string): Promise<BarberWithUser | null>;
  findByIdWithEstablishment(id: string): Promise<BarberWithEstablishment | null>;
  findByUserId(userId: string): Promise<BarberWithUser | null>;
  findAllByEstablishment(establishmentId: string): Promise<BarberWithUser[]>;
  findAllByService(serviceId: string): Promise<BarberWithUser[]>;
  create(data: CreateBarberData): Promise<Barber>;
  update(id: string, data: UpdateBarberData): Promise<Barber>;
  setServices(barberId: string, serviceIds: string[]): Promise<void>;
  delete(id: string): Promise<void>;
}

export const BARBER_REPOSITORY = Symbol('BARBER_REPOSITORY');
