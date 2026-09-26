import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { FeeType, PlatformFeeConfig } from '@prisma/client';
import {
  type IPlatformFeeRepository,
  PLATFORM_FEE_REPOSITORY,
} from '../../domain/interfaces/platform-fee-repository.interface';

export interface FeeCalculationResult {
  feeAmount: number;
  feeRate: number;
  feeType: FeeType;
}

@Injectable()
export class PlatformFeeService {
  constructor(
    @Inject(PLATFORM_FEE_REPOSITORY)
    private readonly feeRepository: IPlatformFeeRepository,
  ) {}

  async getByEstablishment(establishmentId?: string): Promise<PlatformFeeConfig[]> {
    return this.feeRepository.findByEstablishment(establishmentId);
  }

  async getActiveConfig(establishmentId: string, date?: Date): Promise<PlatformFeeConfig | null> {
    return this.feeRepository.findActiveByEstablishment(establishmentId, date);
  }

  async create(data: {
    establishmentId: string;
    feeType: FeeType;
    percentageRate?: number;
    flatAmount?: number;
    minFee?: number;
    maxFee?: number;
    includesTips: boolean;
    effectiveFrom: Date;
    effectiveTo?: Date;
  }): Promise<PlatformFeeConfig> {
    return this.feeRepository.create(data);
  }

  async update(
    id: string,
    data: {
      feeType?: FeeType;
      percentageRate?: number;
      flatAmount?: number;
      minFee?: number;
      maxFee?: number;
      includesTips?: boolean;
      effectiveTo?: Date;
      isActive?: boolean;
    },
  ): Promise<PlatformFeeConfig> {
    const existing = await this.feeRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Platform fee config not found');
    }
    return this.feeRepository.update(id, data);
  }

  calculateFee(
    config: PlatformFeeConfig,
    bookingTotal: number,
    tipAmount: number,
  ): FeeCalculationResult {
    const baseAmount = config.includesTips ? bookingTotal + tipAmount : bookingTotal;
    let feeAmount = 0;
    let feeRate = 0;

    switch (config.feeType) {
      case 'PERCENTAGE': {
        feeRate = config.percentageRate ?? 0;
        feeAmount = baseAmount * (feeRate / 100);
        break;
      }
      case 'FLAT': {
        feeAmount = config.flatAmount ?? 0;
        feeRate = baseAmount > 0 ? (feeAmount / baseAmount) * 100 : 0;
        break;
      }
      case 'HYBRID': {
        const flatPart = config.flatAmount ?? 0;
        const percentPart = baseAmount * ((config.percentageRate ?? 0) / 100);
        feeAmount = flatPart + percentPart;
        feeRate = baseAmount > 0 ? (feeAmount / baseAmount) * 100 : 0;
        break;
      }
      case 'TIERED': {
        // Tiered uses percentageRate as default; extend with tiers table later
        feeRate = config.percentageRate ?? 0;
        feeAmount = baseAmount * (feeRate / 100);
        break;
      }
    }

    // Apply min/max caps
    if (config.minFee != null && feeAmount < config.minFee) {
      feeAmount = config.minFee;
    }
    if (config.maxFee != null && feeAmount > config.maxFee) {
      feeAmount = config.maxFee;
    }

    return {
      feeAmount: Math.round(feeAmount * 100) / 100,
      feeRate: Math.round(feeRate * 100) / 100,
      feeType: config.feeType,
    };
  }
}
