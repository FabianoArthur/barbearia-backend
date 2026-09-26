import { Injectable } from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';

export interface BarberDailySummaryResult {
  date: string;
  appointments: Array<{
    id: string;
    startsAt: Date;
    endsAt: Date;
    status: AppointmentStatus;
    priceSnapshot: number;
    barberAmountSnapshot: number;
    service: { name: string; durationMinutes: number };
    client: { name: string };
  }>;
  completedCount: number;
  commissionTotal: number;
}

@Injectable()
export class BarberDailySummaryQueryHandler {
  constructor(private readonly prisma: PrismaService) {}

  async execute(barberId: string, date: string): Promise<BarberDailySummaryResult> {
    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        barberId,
        deletedAt: null,
        startsAt: { gte: dayStart, lt: dayEnd },
      },
      include: {
        service: { select: { name: true, durationMinutes: true } },
        client: { select: { name: true } },
      },
      orderBy: { startsAt: 'asc' },
    });

    const completed = appointments.filter((a) => a.status === AppointmentStatus.DONE);
    const completedCount = completed.length;
    const commissionTotal = completed.reduce((sum, a) => sum + a.barberAmountSnapshot, 0);

    return {
      date,
      appointments: appointments.map((a) => ({
        id: a.id,
        startsAt: a.startsAt,
        endsAt: a.endsAt,
        status: a.status,
        priceSnapshot: a.priceSnapshot,
        barberAmountSnapshot: a.barberAmountSnapshot,
        service: a.service,
        client: a.client,
      })),
      completedCount,
      commissionTotal,
    };
  }
}
