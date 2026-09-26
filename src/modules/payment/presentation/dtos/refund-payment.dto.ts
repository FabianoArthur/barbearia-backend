import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class RefundPaymentDto {
  @ApiPropertyOptional({
    description: 'Refund amount (defaults to full payment amount if omitted)',
    example: 50.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  readonly amount?: number;

  @ApiPropertyOptional({
    description: 'Reason for the refund',
    example: 'Client unsatisfied with service',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  readonly reason?: string;
}
