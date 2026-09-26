import { Injectable } from '@nestjs/common';
import type { Establishment } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import type {
  CreateEstablishmentData,
  IEstablishmentRepository,
  UpdateEstablishmentData,
} from '../../domain/interfaces/establishment-repository.interface';

@Injectable()
export class PrismaEstablishmentRepository implements IEstablishmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Establishment | null> {
    return this.prisma.establishment.findUnique({ where: { id } });
  }

  async findByName(name: string): Promise<Establishment | null> {
    return this.prisma.establishment.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });
  }

  async findAll(): Promise<Establishment[]> {
    return this.prisma.establishment.findMany({ orderBy: { name: 'asc' } });
  }

  async create(data: CreateEstablishmentData): Promise<Establishment> {
    return this.prisma.establishment.create({ data });
  }

  async update(id: string, data: UpdateEstablishmentData): Promise<Establishment> {
    return this.prisma.establishment.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.establishment.delete({ where: { id } });
  }
}
