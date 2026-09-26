import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateClientDto {
  @ApiProperty({ example: 'clx0987654321' })
  @IsString()
  @IsNotEmpty()
  establishmentId!: string;

  @ApiProperty({ example: 'Carlos Silva' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: '12345678900', description: 'Brazilian CPF (digits only)' })
  @IsString()
  @IsNotEmpty()
  cpf!: string;

  @ApiPropertyOptional({ example: '11999998888' })
  @IsString()
  @IsOptional()
  phone?: string;
}
