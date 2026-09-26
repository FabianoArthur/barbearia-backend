import { ApiProperty } from '@nestjs/swagger';

export class ServicePerformanceItemDto {
  @ApiProperty() readonly serviceId!: string;
  @ApiProperty() readonly serviceName!: string;
  @ApiProperty() readonly grossRevenue!: number;
  @ApiProperty() readonly netRevenue!: number;
  @ApiProperty() readonly bookingCount!: number;
  @ApiProperty() readonly averagePrice!: number;
  @ApiProperty() readonly durationMinutes!: number;
  @ApiProperty() readonly revenuePerMinute!: number;
  @ApiProperty() readonly rank!: number;
}

export class ServiceTrendPointDto {
  @ApiProperty() readonly period!: string;
  @ApiProperty() readonly bookingCount!: number;
  @ApiProperty() readonly grossRevenue!: number;
}

export class ServicePerformanceResponseDto {
  @ApiProperty({ type: [ServicePerformanceItemDto] })
  readonly services!: ServicePerformanceItemDto[];

  @ApiProperty({ type: [ServiceTrendPointDto], description: 'Demand trends over time' })
  readonly trends!: ServiceTrendPointDto[];

  @ApiProperty() readonly generatedAt!: string;
}
