import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({ example: 'clx0987654321', description: 'Establishment ID that owns this service' })
  @IsString()
  @IsNotEmpty()
  establishmentId!: string;

  @ApiProperty({ example: 'Haircut' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 45.0, minimum: 0, description: 'Service price' })
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiProperty({ example: 30, minimum: 1, description: 'Duration in minutes' })
  @IsInt()
  @Min(1)
  durationMinutes!: number;

  @ApiPropertyOptional({ example: 'Includes wash and styling', description: 'Service notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
