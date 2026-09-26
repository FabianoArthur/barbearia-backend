import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class FeeImportItemDto {
  @ApiProperty({ description: 'External transaction/booking identifier' })
  @IsString()
  readonly transactionId!: string;

  @ApiProperty({ description: 'Fee amount charged externally' })
  @IsNumber()
  @Type(() => Number)
  readonly feeAmount!: number;

  @ApiPropertyOptional({ description: 'Transaction date (ISO format)' })
  @IsOptional()
  @IsDateString()
  readonly transactionDate?: string;
}

export class FeeImportDto {
  @ApiProperty({ type: [FeeImportItemDto], description: 'Array of external fee records' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeeImportItemDto)
  readonly items!: FeeImportItemDto[];
}

export class ReconciliationMismatchDto {
  @ApiProperty() readonly appointmentId!: string;
  @ApiProperty() readonly calculatedFee!: number;
  @ApiProperty() readonly actualFee!: number;
  @ApiProperty() readonly difference!: number;
}

export class FeeReconciliationResponseDto {
  @ApiProperty() readonly totalMatched!: number;
  @ApiProperty() readonly totalMismatched!: number;
  @ApiProperty() readonly totalUnmatched!: number;
  @ApiProperty({ type: [ReconciliationMismatchDto] })
  readonly mismatches!: ReconciliationMismatchDto[];
  @ApiProperty() readonly generatedAt!: string;
}
