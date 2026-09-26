import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class CreateAppointmentDto {
  @ApiProperty({ example: 'clx0987654321' })
  @IsString()
  @IsNotEmpty()
  establishmentId!: string;

  @ApiProperty({ example: 'clx1234567890' })
  @IsString()
  @IsNotEmpty()
  barberId!: string;

  @ApiProperty({ example: 'clxclient12345' })
  @IsString()
  @IsNotEmpty()
  clientId!: string;

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
}
