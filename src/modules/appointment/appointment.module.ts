import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { BarberModule } from '../barber/barber.module';
import { NotificationModule } from '../notification/notification.module';
import { PaymentModule } from '../payment/payment.module';
import { BarberDailySummaryQueryHandler } from './application/queries/barber-daily-summary.query-handler';
import { FindAppointmentsQueryHandler } from './application/queries/find-appointments.query-handler';
import { AppointmentService } from './application/services/appointment.service';
import { AppointmentSseService } from './application/services/appointment-sse.service';
import { APPOINTMENT_REPOSITORY } from './domain/interfaces/appointment-repository.interface';
import { AppointmentLifecycleCron } from './infrastructure/jobs/appointment-lifecycle.cron';
import {
  APPOINTMENT_LIFECYCLE_QUEUE,
  AppointmentLifecycleProcessor,
} from './infrastructure/jobs/appointment-lifecycle.processor';
import { PrismaAppointmentRepository } from './infrastructure/repositories/prisma-appointment.repository';
import { AppointmentController } from './presentation/controllers/appointment.controller';
import { AppointmentSseController } from './presentation/controllers/appointment-sse.controller';

@Module({
  imports: [
    BullModule.registerQueue({ name: APPOINTMENT_LIFECYCLE_QUEUE }),
    BarberModule,
    NotificationModule,
    PaymentModule,
  ],
  controllers: [AppointmentController, AppointmentSseController],
  providers: [
    AppointmentService,
    AppointmentLifecycleProcessor,
    AppointmentLifecycleCron,
    AppointmentSseService,
    BarberDailySummaryQueryHandler,
    FindAppointmentsQueryHandler,
    {
      provide: APPOINTMENT_REPOSITORY,
      useClass: PrismaAppointmentRepository,
    },
  ],
  exports: [AppointmentService],
})
export class AppointmentModule {}
