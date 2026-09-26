import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { ScheduleService } from '../../../schedule/application/services/schedule.service';
import {
  FINANCE_ANALYTICS_REPOSITORY,
  type IFinanceAnalyticsRepository,
} from '../../domain/interfaces/finance-analytics-repository.interface';
import type { CapacityResponseDto } from '../../presentation/dtos/capacity-response.dto';

const CAPACITY_CACHE_TTL = 600_000; // 10 minutes

@Injectable()
export class CapacityQueryHandler {
  constructor(
    @Inject(FINANCE_ANALYTICS_REPOSITORY)
    private readonly analyticsRepo: IFinanceAnalyticsRepository,
    private readonly scheduleService: ScheduleService,
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async execute(
    establishmentId: string | undefined,
    startDate: string,
    endDate: string,
    barberId?: string,
  ): Promise<CapacityResponseDto> {
    const cacheKey = `finance:capacity:${establishmentId ?? 'all'}:${startDate}:${endDate}:${barberId ?? ''}`;
    const cached = await this.cache.get<CapacityResponseDto>(cacheKey);
    if (cached) return cached;

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get barbers for this establishment (or all if no establishment specified)
    const barbers = await this.prisma.barber.findMany({
      where: {
        ...(establishmentId ? { establishmentId } : {}),
        ...(barberId ? { id: barberId } : {}),
      },
      include: { user: { select: { name: true } } },
    });

    // Get average booking value for lost revenue estimate
    const summary = await this.analyticsRepo.getRevenueSummary(establishmentId, start, end);
    const avgBookingValue =
      summary.totalBookings > 0 ? summary.grossRevenue / summary.totalBookings : 0;

    const barberCapacities = await Promise.all(
      barbers.map(async (barber) => {
        const totalAvailableMinutes = await this.calculateAvailableMinutes(barber.id, start, end);

        const totalBookedMinutes = await this.calculateBookedMinutes(barber.id, start, end);

        const utilizationRate =
          totalAvailableMinutes > 0
            ? Math.round((totalBookedMinutes / totalAvailableMinutes) * 10000) / 100
            : 0;

        const emptyMinutes = Math.max(0, totalAvailableMinutes - totalBookedMinutes);
        const avgServiceDuration =
          totalBookedMinutes > 0 && summary.totalBookings > 0
            ? totalBookedMinutes / summary.totalBookings
            : 30; // default 30min
        const emptySlots = avgServiceDuration > 0 ? emptyMinutes / avgServiceDuration : 0;
        const lostRevenue = Math.round(emptySlots * avgBookingValue * 100) / 100;

        return {
          barberId: barber.id,
          barberName: barber.user.name,
          totalAvailableMinutes,
          totalBookedMinutes,
          utilizationRate,
          lostRevenue,
        };
      }),
    );

    const totalAvailable = barberCapacities.reduce((s, b) => s + b.totalAvailableMinutes, 0);
    const totalBooked = barberCapacities.reduce((s, b) => s + b.totalBookedMinutes, 0);
    const overallUtilizationRate =
      totalAvailable > 0 ? Math.round((totalBooked / totalAvailable) * 10000) / 100 : 0;
    const totalLostRevenue = barberCapacities.reduce((s, b) => s + b.lostRevenue, 0);

    const result: CapacityResponseDto = {
      barbers: barberCapacities,
      overallUtilizationRate,
      totalLostRevenue: Math.round(totalLostRevenue * 100) / 100,
      generatedAt: new Date().toISOString(),
    };

    await this.cache.set(cacheKey, result, CAPACITY_CACHE_TTL);
    return result;
  }

  private async calculateAvailableMinutes(
    barberId: string,
    start: Date,
    end: Date,
  ): Promise<number> {
    let totalMinutes = 0;
    const current = new Date(start);

    while (current <= end) {
      const periods = await this.scheduleService.getEffectiveWorkingPeriods(barberId, current);
      for (const period of periods) {
        const [startH, startM] = period.startTime.split(':').map(Number);
        const [endH, endM] = period.endTime.split(':').map(Number);
        totalMinutes += endH * 60 + endM - (startH * 60 + startM);
      }
      current.setDate(current.getDate() + 1);
    }

    return totalMinutes;
  }

  private async calculateBookedMinutes(barberId: string, start: Date, end: Date): Promise<number> {
    const appointments = await this.prisma.appointment.findMany({
      where: {
        barberId,
        deletedAt: null,
        status: { in: ['DONE', 'IN_PROGRESS', 'CONFIRMED', 'SCHEDULED', 'CONFIRMATION_PENDING'] },
        startsAt: { gte: start },
        endsAt: { lte: end },
      },
      select: { startsAt: true, endsAt: true },
    });

    return appointments.reduce((total, apt) => {
      const duration = (apt.endsAt.getTime() - apt.startsAt.getTime()) / 60_000;
      return total + duration;
    }, 0);
  }
}
