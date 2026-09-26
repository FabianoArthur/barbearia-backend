import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import {
  APPOINTMENT_REPOSITORY,
  type IAppointmentRepository,
} from '../../../appointment/domain/interfaces/appointment-repository.interface';
import { ReminderProducer } from '../../infrastructure/queues/reminder.producer';

@Injectable()
export class ReminderRecoveryCronService {
  private readonly logger = new Logger(ReminderRecoveryCronService.name);

  constructor(
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepository: IAppointmentRepository,
    private readonly reminderProducer: ReminderProducer,
  ) {}

  /**
   * Safety-net cron: runs every 15 minutes.
   *
   * Finds CONFIRMED appointments between 25-35 min from now that have no
   * reminderSentAt — meaning BullMQ dropped the job (Redis eviction, crash).
   * Re-enqueues them via ReminderProducer.
   */
  @Cron('*/15 * * * *')
  async handleRecoveryCron(): Promise<void> {
    this.logger.log('Running reminder recovery cron...');

    const now = new Date();
    const windowStart = new Date(now.getTime() + 25 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 35 * 60 * 1000);

    const missed = await this.appointmentRepository.findMissedReminders(windowStart, windowEnd);

    if (missed.length === 0) {
      this.logger.log('No missed reminders found');
      return;
    }

    this.logger.warn(`Found ${missed.length} missed reminder(s), re-enqueuing`);

    for (const appointment of missed) {
      try {
        await this.reminderProducer.scheduleReminder(appointment.id, appointment.startsAt);
      } catch (error) {
        this.logger.error(
          `Failed to re-enqueue reminder for ${appointment.id}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }
}
