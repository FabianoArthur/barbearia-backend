import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import {
  APPOINTMENT_REPOSITORY,
  type IAppointmentRepository,
} from '../../../appointment/domain/interfaces/appointment-repository.interface';
import { NotificationService } from './notification.service';

@Injectable()
export class ConfirmationCronService {
  private readonly logger = new Logger(ConfirmationCronService.name);

  constructor(
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepository: IAppointmentRepository,
    private readonly notificationService: NotificationService,
  ) {}

  @Cron('*/5 * * * *')
  async handleConfirmationCron(): Promise<void> {
    this.logger.log('Running confirmation cron job...');

    const now = new Date();
    const windowStart = new Date(now.getTime() + 55 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 65 * 60 * 1000);

    const appointments = await this.appointmentRepository.findPendingConfirmation(
      windowStart,
      windowEnd,
    );

    this.logger.log(`Found ${appointments.length} appointments pending confirmation`);

    for (const appointment of appointments) {
      await this.processAppointment(appointment.id);
    }
  }

  async processAppointment(appointmentId: string): Promise<void> {
    try {
      const acquired = await this.appointmentRepository.atomicSetConfirmationPending(appointmentId);

      if (!acquired) {
        this.logger.log(`Appointment ${appointmentId} already being processed, skipping`);
        return;
      }

      await this.appointmentRepository.createAuditLog({
        appointmentId,
        fromStatus: 'SCHEDULED' as never,
        toStatus: 'CONFIRMATION_PENDING' as never,
        changedBy: 'SYSTEM',
      });

      const appointment = await this.appointmentRepository.findById(appointmentId);

      if (!appointment) {
        this.logger.warn(`Appointment ${appointmentId} not found after lock`);
        return;
      }

      if (!appointment.client.phone) {
        this.logger.warn(`No phone number for appointment ${appointmentId}, skipping WhatsApp`);
        return;
      }

      const result = await this.notificationService.sendConfirmationWhatsApp(appointment);

      await this.appointmentRepository.updateWhatsAppInfo(
        appointmentId,
        result.messageId,
        result.status,
      );

      this.logger.log(
        `WhatsApp sent for appointment ${appointmentId}: messageId=${result.messageId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process appointment ${appointmentId}: ${error instanceof Error ? error.message : String(error)}`,
      );

      try {
        await this.appointmentRepository.clearConfirmationSentAt(appointmentId);
        this.logger.log(
          `Reverted confirmationSentAt for appointment ${appointmentId}, will retry on next run`,
        );
      } catch (revertError) {
        this.logger.error(
          `Failed to revert confirmationSentAt for ${appointmentId}: ${revertError instanceof Error ? revertError.message : String(revertError)}`,
        );
      }
    }
  }
}
