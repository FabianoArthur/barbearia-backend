import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEmail, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateBarberDto {
  @ApiPropertyOptional({ example: 'João Silva', description: 'Barber display name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'joao@example.com', description: 'Barber email' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    example: 60,
    description: 'Commission percentage (0-100)',
    minimum: 0,
    maximum: 100,
  })
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  commissionPercent?: number;

  @ApiPropertyOptional({
    example: ['svc-uuid-1', 'svc-uuid-2'],
    description: 'Service IDs to assign (replaces current set)',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  serviceIds?: string[];
}
