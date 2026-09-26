import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FeeType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';

export class CreatePlatformFeeDto {
  @ApiProperty({ enum: FeeType, example: 'PERCENTAGE' })
  @IsEnum(FeeType)
  readonly feeType!: FeeType;

  @ApiPropertyOptional({ example: 10, description: 'Percentage rate (e.g., 10 for 10%)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  readonly percentageRate?: number;

  @ApiPropertyOptional({ example: 2.5, description: 'Flat fee amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  readonly flatAmount?: number;

  @ApiPropertyOptional({ example: 1, description: 'Minimum fee cap' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  readonly minFee?: number;

  @ApiPropertyOptional({ example: 50, description: 'Maximum fee cap' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  readonly maxFee?: number;

  @ApiProperty({ example: false, description: 'Whether fee calculation includes tips' })
  @IsBoolean()
  readonly includesTips!: boolean;

  @ApiProperty({ example: '2026-03-01T00:00:00.000Z', description: 'Effective from date' })
  @IsDateString()
  readonly effectiveFrom!: string;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59.999Z', description: 'Effective to date' })
  @IsOptional()
  @IsDateString()
  readonly effectiveTo?: string;
}

export class PlatformFeeResponseDto {
  @ApiProperty() readonly id!: string;
  @ApiProperty() readonly establishmentId!: string;
  @ApiProperty({ enum: FeeType }) readonly feeType!: FeeType;
  @ApiPropertyOptional() readonly percentageRate?: number | null;
  @ApiPropertyOptional() readonly flatAmount?: number | null;
  @ApiPropertyOptional() readonly minFee?: number | null;
  @ApiPropertyOptional() readonly maxFee?: number | null;
  @ApiProperty() readonly includesTips!: boolean;
  @ApiProperty() readonly effectiveFrom!: Date;
  @ApiPropertyOptional() readonly effectiveTo?: Date | null;
  @ApiProperty() readonly isActive!: boolean;
  @ApiProperty() readonly createdAt!: Date;
  @ApiProperty() readonly updatedAt!: Date;
}

export class UpdatePlatformFeeDto {
  @ApiPropertyOptional({ enum: FeeType })
  @IsOptional()
  @IsEnum(FeeType)
  readonly feeType?: FeeType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  readonly percentageRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  readonly flatAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  readonly minFee?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  readonly maxFee?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  readonly includesTips?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  readonly effectiveTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  readonly isActive?: boolean;
}
