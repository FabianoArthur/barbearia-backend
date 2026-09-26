import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { type Queue } from 'bullmq';
import { computeReminderDelay } from '../../domain/policies/appointment-reminder.policy';

export const REMINDER_QUEUE = 'appointment-reminders';

export interface ReminderJobData {
  readonly appointmentId: string;
  readonly startsAt: string; // ISO string — serialisable across Redis
}

@Injectable()
export class ReminderProducer {
  private readonly logger = new Logger(ReminderProducer.name);

  constructor(
    @InjectQueue(REMINDER_QUEUE)
    private readonly queue: Queue<ReminderJobData>,
  ) {}

  async scheduleReminder(appointmentId: string, startsAt: Date): Promise<void> {
    const result = computeReminderDelay(startsAt);

    if (result.action === 'skip') {
      this.logger.log(`Skipping reminder for ${appointmentId}: ${result.reason}`);
      return;
    }

    const jobId = `reminder-${appointmentId}`;

    await this.queue.add(
      'send-reminder',
      { appointmentId, startsAt: startsAt.toISOString() },
      {
        jobId,
        delay: result.delay,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5_000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 500 },
      },
    );

    this.logger.log(
      `Scheduled reminder for ${appointmentId} with delay=${result.delay}ms (jobId=${jobId})`,
    );
  }

  async cancelReminder(appointmentId: string): Promise<void> {
    const jobId = `reminder-${appointmentId}`;

    try {
      const job = await this.queue.getJob(jobId);

      if (job) {
        await job.remove();
        this.logger.log(`Cancelled reminder job ${jobId}`);
      } else {
        this.logger.log(`No reminder job found for ${jobId} (already processed or never created)`);
      }
    } catch (error) {
      this.logger.warn(
        `Failed to cancel reminder ${jobId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async rescheduleReminder(appointmentId: string, newStartsAt: Date): Promise<void> {
    await this.cancelReminder(appointmentId);
    await this.scheduleReminder(appointmentId, newStartsAt);
  }
}
