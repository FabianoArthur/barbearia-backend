import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional, IsUUID } from 'class-validator';

const FORMATS = ['csv', 'json'] as const;
export type ExportFormat = (typeof FORMATS)[number];

const REPORT_TYPES = ['revenue', 'barber', 'service', 'customer', 'tax'] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

export class ReportExportQueryDto {
  @ApiPropertyOptional({ description: 'Establishment ID (omit to aggregate)' })
  @IsOptional()
  @IsUUID()
  readonly establishmentId?: string;

  @ApiProperty({ enum: FORMATS, description: 'Export format' })
  @IsIn(FORMATS)
  readonly format!: ExportFormat;

  @ApiProperty({ enum: REPORT_TYPES, description: 'Report type' })
  @IsIn(REPORT_TYPES)
  readonly reportType!: ReportType;

  @ApiPropertyOptional({ description: 'Start date (ISO format)' })
  @IsOptional()
  @IsDateString()
  readonly startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO format)' })
  @IsOptional()
  @IsDateString()
  readonly endDate?: string;
}
