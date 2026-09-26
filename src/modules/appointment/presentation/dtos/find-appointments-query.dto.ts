import { ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dtos';
import type { StatusFilter } from '../../domain/interfaces/appointment-repository.interface';

export type { StatusFilter } from '../../domain/interfaces/appointment-repository.interface';

export const APPOINTMENT_SORTABLE_FIELDS = [
  'startsAt',
  'endsAt',
  'status',
  'createdAt',
  'priceSnapshot',
] as const;

export type AppointmentSortField = (typeof APPOINTMENT_SORTABLE_FIELDS)[number];
export type SortOrder = 'asc' | 'desc';

const ALLOWED_STATUS_FILTERS = [...Object.values(AppointmentStatus), 'LATE'] as const;

export class FindAppointmentsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by establishment ID',
    example: 'clx0987654321',
  })
  @IsOptional()
  @IsString()
  readonly establishmentId?: string;

  @ApiPropertyOptional({
    description: 'Filter by barber ID',
    example: 'clx1234567890',
  })
  @IsOptional()
  @IsString()
  readonly barberId?: string;

  @ApiPropertyOptional({
    description: 'Filter start date (ISO format)',
    example: '2026-03-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  readonly startDate?: string;

  @ApiPropertyOptional({
    description: 'Filter end date (ISO format)',
    example: '2026-03-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  readonly endDate?: string;

  @ApiPropertyOptional({
    description:
      'Comma-separated appointment statuses. Use LATE for appointments past their start time but not yet started.',
    example: 'SCHEDULED,CONFIRMED,IN_PROGRESS',
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',').map((s: string) => s.trim()) : value,
  )
  @IsIn(ALLOWED_STATUS_FILTERS, { each: true })
  readonly status?: StatusFilter[];

  @ApiPropertyOptional({
    description: 'Field to sort by',
    enum: APPOINTMENT_SORTABLE_FIELDS,
    default: 'startsAt',
    example: 'startsAt',
  })
  @IsOptional()
  @IsIn(APPOINTMENT_SORTABLE_FIELDS)
  readonly sortBy: AppointmentSortField = 'startsAt';

  @ApiPropertyOptional({
    description: 'Sort direction',
    enum: ['asc', 'desc'],
    default: 'desc',
    example: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  readonly sortOrder: SortOrder = 'desc';
}
