import { Injectable } from '@nestjs/common';
import type { BarberTimeOff } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import type {
  CreateTimeOffData,
  ITimeOffRepository,
} from '../../domain/interfaces/schedule-repository.interface';

@Injectable()
export class PrismaTimeOffRepository implements ITimeOffRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByBarberId(barberId: string): Promise<BarberTimeOff[]> {
    return this.prisma.barberTimeOff.findMany({
      where: { barberId },
      orderBy: { date: 'asc' },
    });
  }

  async findByBarberAndDate(barberId: string, date: Date): Promise<BarberTimeOff[]> {
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    return this.prisma.barberTimeOff.findMany({
      where: {
        barberId,
        date: { gte: startOfDay, lte: endOfDay },
      },
    });
  }

  async create(data: CreateTimeOffData): Promise<BarberTimeOff> {
    return this.prisma.barberTimeOff.create({ data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.barberTimeOff.delete({ where: { id } });
  }
}
