import { Injectable } from '@nestjs/common';
import type { BarberWorkingHour } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import type {
  CreateWorkingHourData,
  IWorkingHourRepository,
} from '../../domain/interfaces/schedule-repository.interface';

@Injectable()
export class PrismaWorkingHourRepository implements IWorkingHourRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByBarberId(barberId: string): Promise<BarberWorkingHour[]> {
    return this.prisma.barberWorkingHour.findMany({
      where: { barberId },
      orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }],
    });
  }

  async findByBarberAndWeekday(barberId: string, weekday: number): Promise<BarberWorkingHour[]> {
    return this.prisma.barberWorkingHour.findMany({
      where: { barberId, weekday },
      orderBy: { startTime: 'asc' },
    });
  }

  async create(data: CreateWorkingHourData): Promise<BarberWorkingHour> {
    return this.prisma.barberWorkingHour.create({ data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.barberWorkingHour.delete({ where: { id } });
  }

  async deleteAllByBarberId(barberId: string): Promise<void> {
    await this.prisma.barberWorkingHour.deleteMany({ where: { barberId } });
  }
}
