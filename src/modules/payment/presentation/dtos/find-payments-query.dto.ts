import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dtos';

export class FindPaymentsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by establishment ID' })
  @IsOptional()
  @IsUUID()
  readonly establishmentId?: string;

  @ApiPropertyOptional({
    enum: PaymentStatus,
    isArray: true,
    description: 'Filter by payment status (supports multiple values)',
  })
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsEnum(PaymentStatus, { each: true })
  readonly status?: PaymentStatus[];

  @ApiPropertyOptional({
    enum: PaymentMethod,
    isArray: true,
    description: 'Filter by payment method (supports multiple values)',
  })
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsEnum(PaymentMethod, { each: true })
  readonly method?: PaymentMethod[];

  @ApiPropertyOptional({
    description: 'Start date (ISO 8601)',
    example: '2026-01-01',
  })
  @IsOptional()
  @IsDateString()
  readonly startDate?: string;

  @ApiPropertyOptional({
    description: 'End date (ISO 8601)',
    example: '2026-12-31',
  })
  @IsOptional()
  @IsDateString()
  readonly endDate?: string;
}
