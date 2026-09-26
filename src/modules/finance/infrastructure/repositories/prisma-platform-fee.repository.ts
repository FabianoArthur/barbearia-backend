import { Injectable } from '@nestjs/common';
import type { PlatformFeeConfig } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import type {
  CreatePlatformFeeData,
  IPlatformFeeRepository,
  UpdatePlatformFeeData,
} from '../../domain/interfaces/platform-fee-repository.interface';

@Injectable()
export class PrismaPlatformFeeRepository implements IPlatformFeeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEstablishment(establishmentId?: string): Promise<PlatformFeeConfig[]> {
    return this.prisma.platformFeeConfig.findMany({
      where: {
        ...(establishmentId ? { establishmentId } : {}),
      },
      orderBy: { effectiveFrom: 'desc' },
    });
  }

  async findActiveByEstablishment(
    establishmentId: string,
    date?: Date,
  ): Promise<PlatformFeeConfig | null> {
    const referenceDate = date ?? new Date();
    return this.prisma.platformFeeConfig.findFirst({
      where: {
        establishmentId,
        isActive: true,
        effectiveFrom: { lte: referenceDate },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: referenceDate } }],
      },
      orderBy: { effectiveFrom: 'desc' },
    });
  }

  async findById(id: string): Promise<PlatformFeeConfig | null> {
    return this.prisma.platformFeeConfig.findUnique({ where: { id } });
  }

  async create(data: CreatePlatformFeeData): Promise<PlatformFeeConfig> {
    return this.prisma.platformFeeConfig.create({ data });
  }

  async update(id: string, data: UpdatePlatformFeeData): Promise<PlatformFeeConfig> {
    return this.prisma.platformFeeConfig.update({ where: { id }, data });
  }
}
