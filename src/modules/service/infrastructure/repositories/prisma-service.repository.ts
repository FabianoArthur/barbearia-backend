import { Injectable } from '@nestjs/common';
import type { Service } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import type {
  CreateServiceData,
  IServiceRepository,
  UpdateServiceData,
} from '../../domain/interfaces/service-repository.interface';

@Injectable()
export class PrismaServiceRepository implements IServiceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Service[]> {
    return this.prisma.service.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string): Promise<Service | null> {
    return this.prisma.service.findFirst({ where: { id, deletedAt: null } });
  }

  async findAllByEstablishment(establishmentId: string): Promise<Service[]> {
    return this.prisma.service.findMany({
      where: { establishmentId, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async findAvailableByEstablishment(establishmentId: string): Promise<Service[]> {
    return this.prisma.service.findMany({
      where: {
        establishmentId,
        deletedAt: null,
        barbers: { some: {} },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findAllByBarber(barberId: string): Promise<Service[]> {
    return this.prisma.service.findMany({
      where: {
        barbers: { some: { id: barberId } },
        deletedAt: null,
      },
      orderBy: { name: 'asc' },
    });
  }

  async create(data: CreateServiceData): Promise<Service> {
    return this.prisma.service.create({ data });
  }

  async update(id: string, data: UpdateServiceData): Promise<Service> {
    return this.prisma.service.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.service.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
