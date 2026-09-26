import { ApiProperty } from '@nestjs/swagger';
import { AppointmentStatus } from '@prisma/client';
import type { AppointmentListItem } from '../../domain/interfaces/appointment-repository.interface';

export class AppointmentListItemDto {
  @ApiProperty({ example: 'uuid-1234', description: 'Appointment ID' })
  readonly id: string;

  @ApiProperty({ example: 'João Silva', description: 'Barber name' })
  readonly barberName: string;

  @ApiProperty({ example: 'uuid-barber', description: 'Barber ID' })
  readonly barberId: string;

  @ApiProperty({
    example: '2026-03-15T14:00:00.000Z',
    description: 'Appointment date/time',
  })
  readonly date: Date;

  @ApiProperty({ example: 'Carlos Souza', description: 'Client name' })
  readonly clientName: string;

  @ApiProperty({ example: 'uuid-client', description: 'Client ID' })
  readonly clientId: string;

  @ApiProperty({ example: 'Corte Masculino', description: 'Service name' })
  readonly serviceName: string;

  @ApiProperty({ example: 'uuid-service', description: 'Service ID' })
  readonly serviceId: string;

  @ApiProperty({ example: 45.0, description: 'Service price snapshot' })
  readonly serviceValue: number;

  @ApiProperty({
    enum: AppointmentStatus,
    example: AppointmentStatus.SCHEDULED,
    description: 'Current appointment status',
  })
  readonly status: AppointmentStatus;

  private constructor(item: AppointmentListItem) {
    this.id = item.id;
    this.barberName = item.barberName;
    this.barberId = item.barberId;
    this.date = item.date;
    this.clientName = item.clientName;
    this.clientId = item.clientId;
    this.serviceName = item.serviceName;
    this.serviceId = item.serviceId;
    this.serviceValue = item.serviceValue;
    this.status = item.status;
  }

  static fromDomain(item: AppointmentListItem): AppointmentListItemDto {
    return new AppointmentListItemDto(item);
  }

  static fromDomainList(items: AppointmentListItem[]): AppointmentListItemDto[] {
    return items.map(AppointmentListItemDto.fromDomain);
  }
}
