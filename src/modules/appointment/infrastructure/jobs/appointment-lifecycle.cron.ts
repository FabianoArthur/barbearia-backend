import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Queue } from 'bullmq';
import {
  APPOINTMENT_LIFECYCLE_QUEUE,
  type AppointmentLifecycleJobName,
} from './appointment-lifecycle.processor';

@Injectable()
export class AppointmentLifecycleCron {
  private readonly logger = new Logger(AppointmentLifecycleCron.name);

  constructor(
    @InjectQueue(APPOINTMENT_LIFECYCLE_QUEUE)
    private readonly queue: Queue,
  ) {}

  @Cron('*/10 * * * *')
  async markLateBookings(): Promise<void> {
    await this.addJob('mark-late');
  }

  @Cron('*/15 * * * *')
  async autoNoShow(): Promise<void> {
    await this.addJob('auto-no-show');
  }

  @Cron('0 0 * * *')
  async dailySweep(): Promise<void> {
    await this.addJob('daily-sweep');
  }

  private async addJob(name: AppointmentLifecycleJobName): Promise<void> {
    try {
      await this.queue.add(name, {}, { jobId: `${name}-${Date.now()}` });
      this.logger.debug(`Queued job: ${name}`);
    } catch (err) {
      this.logger.error(
        `Failed to queue ${name}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
