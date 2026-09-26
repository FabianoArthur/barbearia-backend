import { ApiProperty } from '@nestjs/swagger';
import { AppointmentStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateStatusDto {
  @ApiProperty({
    enum: AppointmentStatus,
    example: AppointmentStatus.DONE,
    description: 'New appointment status',
  })
  @IsEnum(AppointmentStatus)
  status!: AppointmentStatus;
}
