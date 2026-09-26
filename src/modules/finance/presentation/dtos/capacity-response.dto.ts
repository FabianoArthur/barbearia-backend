import { ApiProperty } from '@nestjs/swagger';

export class BarberCapacityDto {
  @ApiProperty() readonly barberId!: string;
  @ApiProperty() readonly barberName!: string;
  @ApiProperty() readonly totalAvailableMinutes!: number;
  @ApiProperty() readonly totalBookedMinutes!: number;
  @ApiProperty() readonly utilizationRate!: number;
  @ApiProperty() readonly lostRevenue!: number;
}

export class CapacityResponseDto {
  @ApiProperty({ type: [BarberCapacityDto] })
  readonly barbers!: BarberCapacityDto[];

  @ApiProperty() readonly overallUtilizationRate!: number;
  @ApiProperty() readonly totalLostRevenue!: number;
  @ApiProperty() readonly generatedAt!: string;
}
