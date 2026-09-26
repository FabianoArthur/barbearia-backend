import { ApiProperty } from '@nestjs/swagger';

export class TopCustomerDto {
  @ApiProperty() readonly clientId!: string;
  @ApiProperty() readonly clientName!: string;
  @ApiProperty() readonly totalRevenue!: number;
  @ApiProperty() readonly bookingCount!: number;
}

export class CustomerAnalyticsResponseDto {
  @ApiProperty() readonly totalCustomers!: number;
  @ApiProperty() readonly newCustomers!: number;
  @ApiProperty() readonly returningCustomers!: number;
  @ApiProperty() readonly averageBookingsPerCustomer!: number;
  @ApiProperty({ type: [TopCustomerDto] }) readonly topCustomers!: TopCustomerDto[];
  @ApiProperty() readonly retentionRate!: number;
  @ApiProperty() readonly churnedCustomers!: number;
  @ApiProperty() readonly generatedAt!: string;
}
