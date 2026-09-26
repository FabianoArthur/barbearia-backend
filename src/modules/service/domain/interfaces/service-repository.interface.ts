import type { Service } from '@prisma/client';

export interface CreateServiceData {
  establishmentId: string;
  name: string;
  price: number;
  durationMinutes: number;
  notes?: string;
}

export interface UpdateServiceData {
  name?: string;
  price?: number;
  durationMinutes?: number;
  notes?: string;
}

export interface IServiceRepository {
  findAll(): Promise<Service[]>;
  findById(id: string): Promise<Service | null>;
  findAllByEstablishment(establishmentId: string): Promise<Service[]>;
  findAvailableByEstablishment(establishmentId: string): Promise<Service[]>;
  findAllByBarber(barberId: string): Promise<Service[]>;
  create(data: CreateServiceData): Promise<Service>;
  update(id: string, data: UpdateServiceData): Promise<Service>;
  delete(id: string): Promise<void>;
}

export const SERVICE_REPOSITORY = Symbol('SERVICE_REPOSITORY');
