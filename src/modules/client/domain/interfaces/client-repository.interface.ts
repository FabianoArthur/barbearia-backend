import type { Client } from '@prisma/client';

export interface CreateClientData {
  establishmentId: string;
  name: string;
  cpf: string;
  phone?: string;
}

export interface IClientRepository {
  findAll(): Promise<Client[]>;
  findById(id: string): Promise<Client | null>;
  findByCpfAndEstablishment(cpf: string, establishmentId: string): Promise<Client | null>;
  findAllByEstablishment(establishmentId: string): Promise<Client[]>;
  create(data: CreateClientData): Promise<Client>;
  delete(id: string): Promise<void>;
}

export const CLIENT_REPOSITORY = Symbol('CLIENT_REPOSITORY');
