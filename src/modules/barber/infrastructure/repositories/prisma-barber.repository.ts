import { Injectable } from '@nestjs/common';
import type { Barber } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import type {
  BarberWithEstablishment,
  BarberWithUser,
  CreateBarberData,
  IBarberRepository,
  UpdateBarberData,
} from '../../domain/interfaces/barber-repository.interface';

const userSelect = { id: true, name: true, email: true } as const;

@Injectable()
export class PrismaBarberRepository implements IBarberRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<BarberWithUser[]> {
    return this.prisma.barber.findMany({
      include: { user: { select: userSelect } },
    });
  }

  async findById(id: string): Promise<BarberWithUser | null> {
    return this.prisma.barber.findUnique({
      where: { id },
      include: { user: { select: userSelect } },
    });
  }

  async findByIdWithEstablishment(id: string): Promise<BarberWithEstablishment | null> {
    return this.prisma.barber.findUnique({
      where: { id },
      include: {
        user: { select: userSelect },
        establishment: { select: { address: true } },
      },
    });
  }

  async findByUserId(userId: string): Promise<BarberWithUser | null> {
    return this.prisma.barber.findUnique({
      where: { userId },
      include: { user: { select: userSelect } },
    });
  }

  async findAllByEstablishment(establishmentId: string): Promise<BarberWithUser[]> {
    return this.prisma.barber.findMany({
      where: { establishmentId },
      include: { user: { select: userSelect } },
    });
  }

  async findAllByService(serviceId: string): Promise<BarberWithUser[]> {
    return this.prisma.barber.findMany({
      where: { services: { some: { id: serviceId } } },
      include: { user: { select: userSelect } },
    });
  }

  async create(data: CreateBarberData): Promise<Barber> {
    const { serviceIds, ...barberData } = data;
    return this.prisma.barber.create({
      data: {
        ...barberData,
        ...(serviceIds?.length && {
          services: { connect: serviceIds.map((id) => ({ id })) },
        }),
      },
    });
  }

  async update(id: string, data: UpdateBarberData): Promise<Barber> {
    const { serviceIds, name, email, ...barberData } = data;

    return this.prisma.$transaction(async (tx) => {
      if (name || email) {
        const barber = await tx.barber.findUniqueOrThrow({ where: { id } });
        await tx.user.update({
          where: { id: barber.userId },
          data: {
            ...(name && { name }),
            ...(email && { email }),
          },
        });
      }

      if (serviceIds) {
        await tx.barber.update({
          where: { id },
          data: { services: { set: serviceIds.map((sid) => ({ id: sid })) } },
        });
      }

      const hasBarberFields = Object.keys(barberData).length > 0;
      if (hasBarberFields) {
        return tx.barber.update({ where: { id }, data: barberData });
      }

      return tx.barber.findUniqueOrThrow({ where: { id } });
    });
  }

  async setServices(barberId: string, serviceIds: string[]): Promise<void> {
    await this.prisma.barber.update({
      where: { id: barberId },
      data: { services: { set: serviceIds.map((id) => ({ id })) } },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.barber.delete({ where: { id } });
  }
}
