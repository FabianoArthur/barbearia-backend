import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class ConfirmPaymentDto {
  @ApiProperty({
    enum: PaymentMethod,
    description: 'Payment method used',
    example: PaymentMethod.PIX,
  })
  @IsEnum(PaymentMethod)
  readonly method!: PaymentMethod;

  @ApiPropertyOptional({
    description: 'Tip amount given to the barber',
    example: 10.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  readonly tipAmount?: number;

  @ApiPropertyOptional({
    description: 'Optional notes about the payment',
    example: 'Paid via PIX key',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  readonly notes?: string;
}
