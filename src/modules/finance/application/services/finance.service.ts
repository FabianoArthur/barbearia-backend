import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import {
  BARBER_REPOSITORY,
  type IBarberRepository,
} from '../../../barber/domain/interfaces/barber-repository.interface';

@Injectable()
export class FinanceService {
  constructor(
    @Inject(BARBER_REPOSITORY)
    private readonly barberRepository: IBarberRepository,
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async getBarberEarningsSummary(barberId: string): Promise<{
    totalEarned: number;
    expectedEarnings: number;
  }> {
    const resolvedId = await this.resolveBarberIdFromUserId(barberId);

    // Total earned = sum of confirmed payments for this barber's appointments
    const completedPayments = await this.prisma.payment.findMany({
      where: {
        status: 'COMPLETED',
        appointment: { barberId: resolvedId },
      },
      select: { amount: true, tipAmount: true },
    });

    const barber = await this.prisma.barber.findUnique({
      where: { id: resolvedId },
      select: { commissionPercent: true },
    });
    const commissionPercent = barber?.commissionPercent ?? 50;

    const totalEarned = completedPayments.reduce(
      (sum, p) => sum + (p.amount * commissionPercent) / 100 + p.tipAmount,
      0,
    );

    // Expected earnings from scheduled appointments
    const scheduledAppointments = await this.prisma.appointment.findMany({
      where: {
        barberId: resolvedId,
        deletedAt: null,
        status: { in: ['SCHEDULED', 'CONFIRMATION_PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
      },
      select: { barberAmountSnapshot: true },
    });
    const expectedEarnings = scheduledAppointments.reduce(
      (sum, a) => sum + a.barberAmountSnapshot,
      0,
    );

    return { totalEarned, expectedEarnings };
  }

  /**
   * Resolves a userId to the actual Barber.id when the frontend
   * passes the JWT `sub` (User ID) as a barberId param.
   */
  private async resolveBarberIdFromUserId(idOrUserId: string): Promise<string> {
    const barber = await this.barberRepository.findByUserId(idOrUserId);
    if (barber) {
      return barber.id;
    }
    return idOrUserId;
  }

  async invalidateEstablishmentCaches(establishmentId: string): Promise<void> {
    const stores = this.cache.stores;
    if (stores?.[0] && 'keys' in stores[0] && typeof stores[0].keys === 'function') {
      const keys: string[] = await stores[0].keys(`finance:*:${establishmentId}:*`);
      await Promise.all(keys.map((key) => this.cache.del(key)));
    }
  }
}
