import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty } from 'class-validator';

export class RescheduleAppointmentDto {
  @ApiProperty({
    example: '2026-03-20T14:00:00.000Z',
    description: 'New appointment start time in ISO format',
  })
  @IsDateString()
  @IsNotEmpty()
  startsAt!: string;
}
