import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { APPOINTMENT_REPOSITORY } from '../appointment/domain/interfaces/appointment-repository.interface';
import { PrismaAppointmentRepository } from '../appointment/infrastructure/repositories/prisma-appointment.repository';
import { ConfirmationCronService } from './application/services/confirmation-cron.service';
import { NotificationService } from './application/services/notification.service';
import { ReminderRecoveryCronService } from './application/services/reminder-recovery-cron.service';
import { WHATSAPP_PROVIDER } from './domain/interfaces/whatsapp-provider.interface';
import { TwilioWhatsAppProvider } from './infrastructure/providers/twilio-whatsapp.provider';
import { ReminderProcessor } from './infrastructure/queues/reminder.processor';
import { REMINDER_QUEUE, ReminderProducer } from './infrastructure/queues/reminder.producer';
import { ReminderRedisProvider } from './infrastructure/redis/redis.provider';
import { NotificationController } from './presentation/controllers/notification.controller';

@Module({
  imports: [BullModule.registerQueue({ name: REMINDER_QUEUE })],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    ConfirmationCronService,
    ReminderRecoveryCronService,
    ReminderProducer,
    ReminderProcessor,
    ReminderRedisProvider,
    {
      provide: WHATSAPP_PROVIDER,
      useClass: TwilioWhatsAppProvider,
    },
    {
      provide: APPOINTMENT_REPOSITORY,
      useClass: PrismaAppointmentRepository,
    },
  ],
  exports: [NotificationService, ReminderProducer],
})
export class NotificationModule {}
