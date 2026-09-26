import { Module } from '@nestjs/common';
import { AppointmentModule } from '../appointment/appointment.module';
import { APPOINTMENT_REPOSITORY } from '../appointment/domain/interfaces/appointment-repository.interface';
import { PrismaAppointmentRepository } from '../appointment/infrastructure/repositories/prisma-appointment.repository';
import { BarberModule } from '../barber/barber.module';
import { ClientModule } from '../client/client.module';
import { EstablishmentModule } from '../establishment/establishment.module';
import { NotificationModule } from '../notification/notification.module';
import { ScheduleModule } from '../schedule/schedule.module';
import { ServiceModule } from '../service/service.module';
import { GetAvailabilityQueryHandler } from './application/queries/get-availability.query-handler';
import { GetBarberAvailableHoursQueryHandler } from './application/queries/get-barber-available-hours.query-handler';
import { PublicBookingService } from './application/services/public-booking.service';
import { PublicBookingController } from './presentation/controllers/public-booking.controller';

@Module({
  imports: [
    EstablishmentModule,
    BarberModule,
    ServiceModule,
    ScheduleModule,
    ClientModule,
    AppointmentModule,
    NotificationModule,
  ],
  controllers: [PublicBookingController],
  providers: [
    PublicBookingService,
    GetBarberAvailableHoursQueryHandler,
    GetAvailabilityQueryHandler,
    {
      provide: APPOINTMENT_REPOSITORY,
      useClass: PrismaAppointmentRepository,
    },
  ],
})
export class PublicBookingModule {}
