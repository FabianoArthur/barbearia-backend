import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateBarberDto {
  @ApiProperty({ example: 'clx1234567890' })
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({ example: 'clx0987654321' })
  @IsString()
  @IsNotEmpty()
  establishmentId!: string;

  @ApiPropertyOptional({
    example: 50,
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
    description: 'Service IDs to assign to this barber',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  serviceIds?: string[];
}
