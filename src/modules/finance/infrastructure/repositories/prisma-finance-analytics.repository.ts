import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import type {
  BarberRevenue,
  BookingCounts,
  CustomerMetrics,
  Granularity,
  IFinanceAnalyticsRepository,
  PeriodRevenue,
  RevenueSummary,
  ServiceRevenue,
  TodayStats,
  TopPerformers,
} from '../../domain/interfaces/finance-analytics-repository.interface';

@Injectable()
export class PrismaFinanceAnalyticsRepository implements IFinanceAnalyticsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getRevenueSummary(
    establishmentId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<RevenueSummary> {
    const where: Prisma.PaymentWhereInput = {
      status: 'COMPLETED',
      ...(establishmentId ? { establishmentId } : {}),
      ...(startDate || endDate
        ? {
            paidAt: {
              ...(startDate ? { gte: startDate } : {}),
              ...(endDate ? { lte: endDate } : {}),
            },
          }
        : {}),
    };

    const result = await this.prisma.payment.aggregate({
      where,
      _sum: {
        amount: true,
        tipAmount: true,
        platformFeeAmount: true,
        refundAmount: true,
      },
      _count: true,
    });

    const totalBookings = result._count;
    const total = result._sum.amount ?? 0;
    const tips = result._sum.tipAmount ?? 0;
    const fees = result._sum.platformFeeAmount ?? 0;
    const refunds = result._sum.refundAmount ?? 0;

    const grossRevenue = total + tips;
    const netRevenue = grossRevenue - fees - refunds;

    return {
      grossRevenue,
      netRevenue,
      totalBookings,
      totalTips: tips,
      totalPlatformFees: fees,
      totalRefunds: refunds,
      averageOrderValue: totalBookings > 0 ? grossRevenue / totalBookings : 0,
    };
  }

  async getRevenueByBarber(
    establishmentId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<BarberRevenue[]> {
    const dateFilter = this.buildDateFilter(startDate, endDate);
    const estFilter = this.buildEstablishmentFilter(establishmentId);

    const rows = await this.prisma.$queryRaw<
      {
        barberId: string;
        barberName: string;
        totalRevenue: number;
        totalTips: number;
        totalFees: number;
        totalRefunds: number;
        bookingCount: bigint;
      }[]
    >(Prisma.sql`
      SELECT
        a."barberId",
        u."name" AS "barberName",
        COALESCE(SUM(p."amount"), 0)::float AS "totalRevenue",
        COALESCE(SUM(p."tipAmount"), 0)::float AS "totalTips",
        COALESCE(SUM(p."platformFeeAmount"), 0)::float AS "totalFees",
        COALESCE(SUM(p."refundAmount"), 0)::float AS "totalRefunds",
        COUNT(*)::bigint AS "bookingCount"
      FROM "Payment" p
      JOIN "Appointment" a ON a."id" = p."appointmentId"
      JOIN "Barber" b ON b."id" = a."barberId"
      JOIN "User" u ON u."id" = b."userId"
      WHERE p."status" = 'COMPLETED'
        AND ${estFilter}
        ${dateFilter}
      GROUP BY a."barberId", u."name"
      ORDER BY SUM(p."amount" + p."tipAmount") DESC
    `);

    return rows.map((row) => {
      const grossRevenue = row.totalRevenue + row.totalTips;
      const netRevenue = grossRevenue - row.totalFees - row.totalRefunds;
      const count = Number(row.bookingCount);
      return {
        barberId: row.barberId,
        barberName: row.barberName,
        grossRevenue,
        netRevenue,
        totalTips: row.totalTips,
        totalPlatformFees: row.totalFees,
        bookingCount: count,
        averageOrderValue: count > 0 ? grossRevenue / count : 0,
        tipsToRevenueRatio: grossRevenue > 0 ? row.totalTips / grossRevenue : 0,
      };
    });
  }

  async getRevenueByService(
    establishmentId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<ServiceRevenue[]> {
    const dateFilter = this.buildDateFilter(startDate, endDate);
    const estFilter = this.buildEstablishmentFilter(establishmentId);

    const rows = await this.prisma.$queryRaw<
      {
        serviceId: string;
        serviceName: string;
        durationMinutes: number;
        totalRevenue: number;
        totalTips: number;
        totalFees: number;
        totalRefunds: number;
        bookingCount: bigint;
      }[]
    >(Prisma.sql`
      SELECT
        a."serviceId",
        s."name" AS "serviceName",
        s."durationMinutes",
        COALESCE(SUM(p."amount"), 0)::float AS "totalRevenue",
        COALESCE(SUM(p."tipAmount"), 0)::float AS "totalTips",
        COALESCE(SUM(p."platformFeeAmount"), 0)::float AS "totalFees",
        COALESCE(SUM(p."refundAmount"), 0)::float AS "totalRefunds",
        COUNT(*)::bigint AS "bookingCount"
      FROM "Payment" p
      JOIN "Appointment" a ON a."id" = p."appointmentId"
      JOIN "Service" s ON s."id" = a."serviceId"
      WHERE p."status" = 'COMPLETED'
        AND ${estFilter}
        ${dateFilter}
      GROUP BY a."serviceId", s."name", s."durationMinutes"
      ORDER BY SUM(p."amount" + p."tipAmount") DESC
    `);

    return rows.map((row) => {
      const grossRevenue = row.totalRevenue + row.totalTips;
      const netRevenue = grossRevenue - row.totalFees - row.totalRefunds;
      const count = Number(row.bookingCount);
      return {
        serviceId: row.serviceId,
        serviceName: row.serviceName,
        grossRevenue,
        netRevenue,
        bookingCount: count,
        averagePrice: count > 0 ? grossRevenue / count : 0,
        durationMinutes: row.durationMinutes,
        revenuePerMinute:
          row.durationMinutes > 0 && count > 0 ? grossRevenue / (row.durationMinutes * count) : 0,
      };
    });
  }

  async getRevenueByPeriod(
    establishmentId: string | undefined,
    granularity: Granularity,
    startDate?: Date,
    endDate?: Date,
  ): Promise<PeriodRevenue[]> {
    const truncUnit = this.granularityToPostgres(granularity);
    const dateFilter = this.buildDateFilter(startDate, endDate);
    const estFilter = this.buildEstablishmentFilter(establishmentId);

    const rows = await this.prisma.$queryRaw<
      {
        period: Date;
        totalRevenue: number;
        totalTips: number;
        totalFees: number;
        totalRefunds: number;
        bookingCount: bigint;
      }[]
    >(Prisma.sql`
      SELECT
        DATE_TRUNC(${Prisma.raw(`'${truncUnit}'`)}, p."paidAt") AS "period",
        COALESCE(SUM(p."amount"), 0)::float AS "totalRevenue",
        COALESCE(SUM(p."tipAmount"), 0)::float AS "totalTips",
        COALESCE(SUM(p."platformFeeAmount"), 0)::float AS "totalFees",
        COALESCE(SUM(p."refundAmount"), 0)::float AS "totalRefunds",
        COUNT(*)::bigint AS "bookingCount"
      FROM "Payment" p
      WHERE p."status" = 'COMPLETED'
        AND ${estFilter}
        AND p."paidAt" IS NOT NULL
        ${dateFilter}
      GROUP BY DATE_TRUNC(${Prisma.raw(`'${truncUnit}'`)}, p."paidAt")
      ORDER BY "period" ASC
    `);

    return rows.map((row) => {
      const grossRevenue = row.totalRevenue + row.totalTips;
      const netRevenue = grossRevenue - row.totalFees - row.totalRefunds;
      return {
        period: row.period.toISOString(),
        grossRevenue,
        netRevenue,
        totalTips: row.totalTips,
        totalPlatformFees: row.totalFees,
        bookingCount: Number(row.bookingCount),
      };
    });
  }

  async getBookingCounts(
    establishmentId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<BookingCounts> {
    const dateWhere: Prisma.AppointmentWhereInput = {
      deletedAt: null,
      ...(establishmentId ? { establishmentId } : {}),
      ...(startDate || endDate
        ? {
            startsAt: {
              ...(startDate ? { gte: startDate } : {}),
              ...(endDate ? { lte: endDate } : {}),
            },
          }
        : {}),
    };

    const [total, completed, canceled, noShow] = await Promise.all([
      this.prisma.appointment.count({ where: dateWhere }),
      this.prisma.appointment.count({ where: { ...dateWhere, status: 'DONE' } }),
      this.prisma.appointment.count({ where: { ...dateWhere, status: 'CANCELED' } }),
      this.prisma.appointment.count({ where: { ...dateWhere, status: 'NO_SHOW' } }),
    ]);

    return {
      total,
      completed,
      canceled,
      noShow,
      completionRate: total > 0 ? completed / total : 0,
      cancellationRate: total > 0 ? canceled / total : 0,
      noShowRate: total > 0 ? noShow / total : 0,
    };
  }

  async getTopPerformers(
    establishmentId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<TopPerformers> {
    const dateFilter = this.buildDateFilter(startDate, endDate);
    const estFilter = this.buildEstablishmentFilter(establishmentId);

    const topBarberRows = await this.prisma.$queryRaw<
      { barberId: string; barberName: string; grossRevenue: number }[]
    >(Prisma.sql`
      SELECT
        a."barberId",
        u."name" AS "barberName",
        (COALESCE(SUM(p."amount"), 0) + COALESCE(SUM(p."tipAmount"), 0))::float AS "grossRevenue"
      FROM "Payment" p
      JOIN "Appointment" a ON a."id" = p."appointmentId"
      JOIN "Barber" b ON b."id" = a."barberId"
      JOIN "User" u ON u."id" = b."userId"
      WHERE p."status" = 'COMPLETED'
        AND ${estFilter}
        ${dateFilter}
      GROUP BY a."barberId", u."name"
      ORDER BY "grossRevenue" DESC
      LIMIT 1
    `);

    const topServiceRows = await this.prisma.$queryRaw<
      { serviceId: string; serviceName: string; bookingCount: bigint }[]
    >(Prisma.sql`
      SELECT
        a."serviceId",
        s."name" AS "serviceName",
        COUNT(*)::bigint AS "bookingCount"
      FROM "Payment" p
      JOIN "Appointment" a ON a."id" = p."appointmentId"
      JOIN "Service" s ON s."id" = a."serviceId"
      WHERE p."status" = 'COMPLETED'
        AND ${estFilter}
        ${dateFilter}
      GROUP BY a."serviceId", s."name"
      ORDER BY "bookingCount" DESC
      LIMIT 1
    `);

    return {
      topBarber: topBarberRows[0]
        ? {
            barberId: topBarberRows[0].barberId,
            barberName: topBarberRows[0].barberName,
            grossRevenue: topBarberRows[0].grossRevenue,
          }
        : null,
      topService: topServiceRows[0]
        ? {
            serviceId: topServiceRows[0].serviceId,
            serviceName: topServiceRows[0].serviceName,
            bookingCount: Number(topServiceRows[0].bookingCount),
          }
        : null,
    };
  }

  async getTodayStats(establishmentId?: string): Promise<TodayStats> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const result = await this.prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
        ...(establishmentId ? { establishmentId } : {}),
        paidAt: { gte: todayStart, lte: todayEnd },
      },
      _sum: { amount: true, tipAmount: true },
      _count: true,
    });

    return {
      revenue: (result._sum.amount ?? 0) + (result._sum.tipAmount ?? 0),
      bookingCount: result._count,
      tips: result._sum.tipAmount ?? 0,
    };
  }

  async getCustomerMetrics(
    establishmentId?: string,
    startDate?: Date,
    endDate?: Date,
    limit = 10,
  ): Promise<CustomerMetrics> {
    const dateFilter = this.buildDateFilter(startDate, endDate);
    const estFilter = this.buildEstablishmentFilter(establishmentId);

    // Top customers
    const topCustomersRows = await this.prisma.$queryRaw<
      {
        clientId: string;
        clientName: string;
        totalRevenue: number;
        bookingCount: bigint;
      }[]
    >(Prisma.sql`
      SELECT
        a."clientId",
        c."name" AS "clientName",
        (COALESCE(SUM(p."amount"), 0) + COALESCE(SUM(p."tipAmount"), 0))::float AS "totalRevenue",
        COUNT(*)::bigint AS "bookingCount"
      FROM "Payment" p
      JOIN "Appointment" a ON a."id" = p."appointmentId"
      JOIN "Client" c ON c."id" = a."clientId"
      WHERE p."status" = 'COMPLETED'
        AND ${estFilter}
        ${dateFilter}
      GROUP BY a."clientId", c."name"
      ORDER BY "totalRevenue" DESC
      LIMIT ${limit}
    `);

    // Total unique customers with completed payments
    const totalCustomersResult = await this.prisma.$queryRaw<{ count: bigint }[]>(Prisma.sql`
      SELECT COUNT(DISTINCT a."clientId")::bigint AS "count"
      FROM "Payment" p
      JOIN "Appointment" a ON a."id" = p."appointmentId"
      WHERE p."status" = 'COMPLETED'
        AND ${estFilter}
        ${dateFilter}
    `);
    const totalCustomers = Number(totalCustomersResult[0]?.count ?? 0);

    // New customers (first payment in period)
    const newCustomersResult = await this.prisma.$queryRaw<{ count: bigint }[]>(Prisma.sql`
      SELECT COUNT(*)::bigint AS "count"
      FROM (
        SELECT a."clientId", MIN(p."paidAt") AS "firstPayment"
        FROM "Payment" p
        JOIN "Appointment" a ON a."id" = p."appointmentId"
        WHERE p."status" = 'COMPLETED'
          AND ${estFilter}
        GROUP BY a."clientId"
        HAVING MIN(p."paidAt") >= ${startDate ?? new Date('1970-01-01')}
          ${endDate ? Prisma.sql`AND MIN(p."paidAt") <= ${endDate}` : Prisma.empty}
      ) sub
    `);
    const newCustomers = Number(newCustomersResult[0]?.count ?? 0);
    const returningCustomers = totalCustomers - newCustomers;

    // Average bookings per customer
    const avgBookingsResult = await this.prisma.$queryRaw<{ avg: number }[]>(Prisma.sql`
      SELECT COALESCE(AVG(sub."cnt"), 0)::float AS "avg"
      FROM (
        SELECT a."clientId", COUNT(*)::float AS "cnt"
        FROM "Payment" p
        JOIN "Appointment" a ON a."id" = p."appointmentId"
        WHERE p."status" = 'COMPLETED'
          AND ${estFilter}
          ${dateFilter}
        GROUP BY a."clientId"
      ) sub
    `);

    // Churned: customers with last payment > 60 days ago
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const churnedResult = await this.prisma.$queryRaw<{ count: bigint }[]>(Prisma.sql`
      SELECT COUNT(*)::bigint AS "count"
      FROM (
        SELECT a."clientId", MAX(p."paidAt") AS "lastPayment"
        FROM "Payment" p
        JOIN "Appointment" a ON a."id" = p."appointmentId"
        WHERE p."status" = 'COMPLETED'
          AND ${estFilter}
        GROUP BY a."clientId"
        HAVING MAX(p."paidAt") < ${sixtyDaysAgo}
      ) sub
    `);

    const churnedCustomers = Number(churnedResult[0]?.count ?? 0);
    const retentionRate =
      totalCustomers > 0 ? (totalCustomers - churnedCustomers) / totalCustomers : 0;

    return {
      totalCustomers,
      newCustomers,
      returningCustomers,
      averageBookingsPerCustomer: avgBookingsResult[0]?.avg ?? 0,
      topCustomers: topCustomersRows.map((row) => ({
        clientId: row.clientId,
        clientName: row.clientName,
        totalRevenue: row.totalRevenue,
        bookingCount: Number(row.bookingCount),
      })),
      retentionRate,
      churnedCustomers,
    };
  }

  private buildEstablishmentFilter(establishmentId?: string): Prisma.Sql {
    return establishmentId
      ? Prisma.sql`p."establishmentId" = ${establishmentId}`
      : Prisma.sql`TRUE`;
  }

  private buildDateFilter(startDate?: Date, endDate?: Date): Prisma.Sql {
    if (startDate && endDate) {
      return Prisma.sql`AND p."paidAt" >= ${startDate} AND p."paidAt" <= ${endDate}`;
    }
    if (startDate) {
      return Prisma.sql`AND p."paidAt" >= ${startDate}`;
    }
    if (endDate) {
      return Prisma.sql`AND p."paidAt" <= ${endDate}`;
    }
    return Prisma.empty;
  }

  private granularityToPostgres(
    granularity: Granularity,
  ): 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year' {
    const mapping: Record<Granularity, 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year'> = {
      hour: 'hour',
      day: 'day',
      week: 'week',
      month: 'month',
      quarter: 'quarter',
      year: 'year',
    };
    return mapping[granularity];
  }
}
