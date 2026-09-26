import { Injectable } from '@nestjs/common';
import type { BarberScheduleOverride } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import type {
  CreateScheduleOverrideData,
  IScheduleOverrideRepository,
} from '../../domain/interfaces/schedule-repository.interface';

@Injectable()
export class PrismaScheduleOverrideRepository implements IScheduleOverrideRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByBarberId(barberId: string): Promise<BarberScheduleOverride[]> {
    return this.prisma.barberScheduleOverride.findMany({
      where: { barberId },
      orderBy: { startDate: 'asc' },
    });
  }

  async findByBarberAndDateRange(barberId: string, date: Date): Promise<BarberScheduleOverride[]> {
    return this.prisma.barberScheduleOverride.findMany({
      where: {
        barberId,
        startDate: { lte: date },
        endDate: { gte: date },
      },
    });
  }

  async create(data: CreateScheduleOverrideData): Promise<BarberScheduleOverride> {
    return this.prisma.barberScheduleOverride.create({ data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.barberScheduleOverride.delete({ where: { id } });
  }
}
