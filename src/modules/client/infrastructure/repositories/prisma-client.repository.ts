import { Injectable } from '@nestjs/common';
import type { Client } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import type {
  CreateClientData,
  IClientRepository,
} from '../../domain/interfaces/client-repository.interface';

@Injectable()
export class PrismaClientRepository implements IClientRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Client[]> {
    return this.prisma.client.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findById(id: string): Promise<Client | null> {
    return this.prisma.client.findUnique({ where: { id } });
  }

  async findByCpfAndEstablishment(cpf: string, establishmentId: string): Promise<Client | null> {
    return this.prisma.client.findUnique({
      where: { cpf_establishmentId: { cpf, establishmentId } },
    });
  }

  async findAllByEstablishment(establishmentId: string): Promise<Client[]> {
    return this.prisma.client.findMany({
      where: { establishmentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: CreateClientData): Promise<Client> {
    return this.prisma.client.create({ data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.client.delete({ where: { id } });
  }
}
