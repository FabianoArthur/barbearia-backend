import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateEstablishmentDto {
  @ApiPropertyOptional({ example: 'Barber Shop Uptown' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Rua Augusta, 1234 - Consolacao, Sao Paulo' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: -23.5505 })
  @IsNumber()
  @IsOptional()
  lat?: number;

  @ApiPropertyOptional({ example: -46.6333 })
  @IsNumber()
  @IsOptional()
  lng?: number;

  @ApiPropertyOptional({ example: 3000.0, description: 'Monthly operational cost' })
  @IsNumber()
  @IsOptional()
  monthlyCost?: number;
}
