import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import type {
  FeeImportItemDto,
  FeeReconciliationResponseDto,
  ReconciliationMismatchDto,
} from '../../presentation/dtos/fee-reconciliation.dto';

const FEE_TOLERANCE = 0.01; // R$0.01 tolerance for rounding

@Injectable()
export class FeeReconciliationService {
  constructor(private readonly prisma: PrismaService) {}

  async reconcile(
    establishmentId: string,
    items: FeeImportItemDto[],
  ): Promise<FeeReconciliationResponseDto> {
    let totalMatched = 0;
    let totalMismatched = 0;
    let totalUnmatched = 0;
    const mismatches: ReconciliationMismatchDto[] = [];

    for (const item of items) {
      // Try to match by appointment ID or appointment code
      const payment = await this.prisma.payment.findFirst({
        where: {
          establishmentId,
          status: 'COMPLETED',
          OR: [
            { appointmentId: item.transactionId },
            { appointment: { code: item.transactionId } },
          ],
        },
      });

      if (!payment) {
        totalUnmatched++;
        continue;
      }

      const difference = Math.abs(payment.platformFeeAmount - item.feeAmount);

      if (difference <= FEE_TOLERANCE) {
        totalMatched++;
      } else {
        totalMismatched++;
        mismatches.push({
          appointmentId: payment.appointmentId,
          calculatedFee: payment.platformFeeAmount,
          actualFee: item.feeAmount,
          difference: Math.round((item.feeAmount - payment.platformFeeAmount) * 100) / 100,
        });
      }
    }

    return {
      totalMatched,
      totalMismatched,
      totalUnmatched,
      mismatches,
      generatedAt: new Date().toISOString(),
    };
  }

  async getReconciliationReport(
    establishmentId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<{
    totalRecords: number;
    totalFeesCalculated: number;
    averageFeePerBooking: number;
    feeDistribution: { range: string; count: number }[];
  }> {
    const where = {
      establishmentId,
      status: 'COMPLETED' as const,
      ...(startDate || endDate
        ? {
            paidAt: {
              ...(startDate ? { gte: new Date(startDate) } : {}),
              ...(endDate ? { lte: new Date(endDate) } : {}),
            },
          }
        : {}),
    };

    const aggregate = await this.prisma.payment.aggregate({
      where,
      _sum: { platformFeeAmount: true },
      _avg: { platformFeeAmount: true },
      _count: true,
    });

    // Fee distribution buckets
    const records = await this.prisma.payment.findMany({
      where,
      select: { platformFeeAmount: true },
    });

    const buckets = [
      { range: 'R$0', min: 0, max: 0.001 },
      { range: 'R$0.01 - R$5', min: 0.001, max: 5 },
      { range: 'R$5 - R$10', min: 5, max: 10 },
      { range: 'R$10 - R$25', min: 10, max: 25 },
      { range: 'R$25+', min: 25, max: Number.POSITIVE_INFINITY },
    ];

    const feeDistribution = buckets.map((bucket) => ({
      range: bucket.range,
      count: records.filter(
        (r) => r.platformFeeAmount >= bucket.min && r.platformFeeAmount < bucket.max,
      ).length,
    }));

    return {
      totalRecords: aggregate._count,
      totalFeesCalculated: aggregate._sum.platformFeeAmount ?? 0,
      averageFeePerBooking: aggregate._avg.platformFeeAmount ?? 0,
      feeDistribution,
    };
  }
}
