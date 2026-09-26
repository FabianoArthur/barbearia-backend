import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { type Job } from 'bullmq';
import type Redis from 'ioredis';
import {
  APPOINTMENT_REPOSITORY,
  type IAppointmentRepository,
} from '../../../appointment/domain/interfaces/appointment-repository.interface';
import { NotificationService } from '../../application/services/notification.service';
import { REMINDER_REDIS } from '../redis/redis.provider';
import { REMINDER_QUEUE, type ReminderJobData } from './reminder.producer';

const LOCK_TTL_MS = 30_000;

@Processor(REMINDER_QUEUE, { concurrency: 5 })
export class ReminderProcessor extends WorkerHost {
  private readonly logger = new Logger(ReminderProcessor.name);

  constructor(
    @Inject(REMINDER_REDIS)
    private readonly redis: Redis,
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepository: IAppointmentRepository,
    private readonly notificationService: NotificationService,
  ) {
    super();
  }

  async process(job: Job<ReminderJobData>): Promise<void> {
    const { appointmentId, startsAt } = job.data;
    this.logger.log(`Processing reminder for appointment ${appointmentId}`);

    // 1. Fast-path: check Redis idempotency marker
    const alreadySent = await this.redis.get(`reminder:sent:${appointmentId}`);
    if (alreadySent) {
      this.logger.log(`Reminder already sent for ${appointmentId}, skipping`);
      return;
    }

    // 2. Acquire distributed lock
    const lockKey = `reminder:lock:${appointmentId}`;
    const lockAcquired = await this.redis.set(lockKey, '1', 'PX', LOCK_TTL_MS, 'NX');
    if (!lockAcquired) {
      this.logger.log(`Could not acquire lock for ${appointmentId}, another worker is processing`);
      return;
    }

    try {
      // 3. DB guard: fetch appointment and validate state
      const appointment = await this.appointmentRepository.findById(appointmentId);

      if (!appointment) {
        this.logger.warn(`Appointment ${appointmentId} not found, skipping reminder`);
        return;
      }

      if (appointment.status !== AppointmentStatus.CONFIRMED) {
        this.logger.log(
          `Appointment ${appointmentId} is ${appointment.status}, not CONFIRMED — skipping`,
        );
        return;
      }

      if (appointment.reminderSentAt) {
        this.logger.log(`Reminder already sent in DB for ${appointmentId}, skipping`);
        return;
      }

      // 4. Send WhatsApp reminder
      const result = await this.notificationService.sendReminderWhatsApp(appointment);

      // 5. Mark as sent in Redis + DB simultaneously
      const appointmentTime = new Date(startsAt).getTime();
      const sentKeyTtl = Math.max(appointmentTime + 60 * 60 * 1000 - Date.now(), 60_000);

      await Promise.all([
        this.redis.set(`reminder:sent:${appointmentId}`, '1', 'PX', sentKeyTtl),
        this.appointmentRepository.updateReminderSentAt(appointmentId, result.messageId),
      ]);

      this.logger.log(`Reminder sent for ${appointmentId}: messageId=${result.messageId}`);
    } finally {
      // 6. Release lock (best-effort; TTL is the safety net)
      await this.redis.del(lockKey).catch(() => {});
    }
  }
}
