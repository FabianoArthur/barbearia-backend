import type { Establishment } from '@prisma/client';

export interface CreateEstablishmentData {
  name: string;
  lat?: number;
  lng?: number;
  monthlyCost?: number;
}

export interface UpdateEstablishmentData {
  name?: string;
  lat?: number;
  lng?: number;
  monthlyCost?: number;
}

export interface IEstablishmentRepository {
  findById(id: string): Promise<Establishment | null>;
  findByName(name: string): Promise<Establishment | null>;
  findAll(): Promise<Establishment[]>;
  create(data: CreateEstablishmentData): Promise<Establishment>;
  update(id: string, data: UpdateEstablishmentData): Promise<Establishment>;
  delete(id: string): Promise<void>;
}

export const ESTABLISHMENT_REPOSITORY = Symbol('ESTABLISHMENT_REPOSITORY');
