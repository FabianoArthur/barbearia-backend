import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreatePublicAppointmentDto {
  @ApiProperty({ example: 'clx0987654321' })
  @IsString()
  @IsNotEmpty()
  establishmentId!: string;

  @ApiProperty({ example: 'clx1234567890' })
  @IsString()
  @IsNotEmpty()
  barberId!: string;

  @ApiProperty({ example: 'clxservice12345' })
  @IsString()
  @IsNotEmpty()
  serviceId!: string;

  @ApiProperty({
    example: '2026-03-15T10:00:00.000Z',
    description: 'Appointment start time in ISO format',
  })
  @IsDateString()
  startsAt!: string;

  @ApiProperty({ example: 'Carlos Silva' })
  @IsString()
  @IsNotEmpty()
  clientName!: string;

  @ApiProperty({
    example: '12345678900',
    description: 'Brazilian CPF (digits only)',
  })
  @IsString()
  @IsNotEmpty()
  clientCpf!: string;

  @ApiPropertyOptional({
    example: '+5511999998888',
    description: 'Phone number (Brazilian, E.164 format preferred)',
  })
  @IsString()
  @IsOptional()
  @Matches(/^(\+?55)?\d{10,11}$/, {
    message: 'clientPhone must be a valid Brazilian phone number',
  })
  clientPhone?: string;
}
