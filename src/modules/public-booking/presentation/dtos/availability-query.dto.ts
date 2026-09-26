import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class AvailabilityQueryDto {
  @ApiProperty({ example: 'clx1234567890' })
  @IsString()
  @IsNotEmpty()
  barberId!: string;

  @ApiProperty({ example: '2026-03-15', description: 'Date in ISO format' })
  @IsDateString()
  date!: string;

  @ApiProperty({ example: 'clxservice12345' })
  @IsString()
  @IsNotEmpty()
  serviceId!: string;
}
