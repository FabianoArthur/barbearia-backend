import type { FeeType, PlatformFeeConfig } from '@prisma/client';

export interface CreatePlatformFeeData {
  establishmentId: string;
  feeType: FeeType;
  percentageRate?: number;
  flatAmount?: number;
  minFee?: number;
  maxFee?: number;
  includesTips: boolean;
  effectiveFrom: Date;
  effectiveTo?: Date;
}

export interface UpdatePlatformFeeData {
  feeType?: FeeType;
  percentageRate?: number;
  flatAmount?: number;
  minFee?: number;
  maxFee?: number;
  includesTips?: boolean;
  effectiveTo?: Date;
  isActive?: boolean;
}

export interface IPlatformFeeRepository {
  findByEstablishment(establishmentId?: string): Promise<PlatformFeeConfig[]>;
  findActiveByEstablishment(
    establishmentId: string,
    date?: Date,
  ): Promise<PlatformFeeConfig | null>;
  findById(id: string): Promise<PlatformFeeConfig | null>;
  create(data: CreatePlatformFeeData): Promise<PlatformFeeConfig>;
  update(id: string, data: UpdatePlatformFeeData): Promise<PlatformFeeConfig>;
}

export const PLATFORM_FEE_REPOSITORY = Symbol('PLATFORM_FEE_REPOSITORY');
