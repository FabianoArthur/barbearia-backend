import { ApiProperty } from '@nestjs/swagger';

export class ForecastPointDto {
  @ApiProperty() readonly period!: string;
  @ApiProperty() readonly predictedRevenue!: number;
  @ApiProperty() readonly confidence!: 'low' | 'medium' | 'high';
}

export class AnomalyDto {
  @ApiProperty() readonly period!: string;
  @ApiProperty() readonly actualRevenue!: number;
  @ApiProperty() readonly expectedRevenue!: number;
  @ApiProperty() readonly deviation!: number;
  @ApiProperty() readonly type!: 'spike' | 'drop';
}

export class SeasonalPatternDto {
  @ApiProperty() readonly period!: string;
  @ApiProperty() readonly averageRevenue!: number;
  @ApiProperty() readonly relativeStrength!: number;
}

export class ForecastingResponseDto {
  @ApiProperty({ type: [ForecastPointDto] })
  readonly forecast!: ForecastPointDto[];

  @ApiProperty({ type: [AnomalyDto] })
  readonly anomalies!: AnomalyDto[];

  @ApiProperty({ type: [SeasonalPatternDto] })
  readonly seasonalPatterns!: SeasonalPatternDto[];

  @ApiProperty() readonly movingAverage!: number;
  @ApiProperty() readonly trend!: 'growing' | 'declining' | 'stable';
  @ApiProperty() readonly generatedAt!: string;
}
