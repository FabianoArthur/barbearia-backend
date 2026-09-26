import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { Job } from 'bullmq';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { AppointmentService } from '../../application/services/appointment.service';

export const APPOINTMENT_LIFECYCLE_QUEUE = 'appointment-lifecycle';

export type AppointmentLifecycleJobName = 'mark-late' | 'auto-no-show' | 'daily-sweep';

@Processor(APPOINTMENT_LIFECYCLE_QUEUE)
export class AppointmentLifecycleProcessor extends WorkerHost {
  private readonly logger = new Logger(AppointmentLifecycleProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly appointmentService: AppointmentService,
  ) {
    super();
  }

  async process(
    job: Job<Record<string, unknown>, unknown, AppointmentLifecycleJobName>,
  ): Promise<void> {
    switch (job.name) {
      case 'mark-late':
        await this.handleMarkLate();
        break;
      case 'auto-no-show':
        await this.handleAutoNoShow();
        break;
      case 'daily-sweep':
        await this.handleDailySweep();
        break;
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  private async handleMarkLate(): Promise<void> {
    const cutoff = new Date(Date.now() - 15 * 60 * 1000);

    const late = await this.prisma.appointment.findMany({
      where: {
        status: AppointmentStatus.CONFIRMED,
        startsAt: { lt: cutoff },
        startedAt: null,
        deletedAt: null,
      },
      select: { id: true, code: true, startsAt: true },
    });

    for (const a of late) {
      this.logger.warn(
        `Late appointment flagged: id=${a.id} code=${a.code} startsAt=${a.startsAt.toISOString()}`,
      );
    }

    if (late.length > 0) {
      this.logger.warn(`Marked ${late.length} late appointment(s)`);
    }
  }

  private async handleAutoNoShow(): Promise<void> {
    const cutoff = new Date(Date.now() - 30 * 60 * 1000);

    const eligible = await this.prisma.appointment.findMany({
      where: {
        status: {
          in: [
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.SCHEDULED,
            AppointmentStatus.CONFIRMATION_PENDING,
          ],
        },
        endsAt: { lt: cutoff },
        deletedAt: null,
      },
      select: { id: true },
    });

    for (const a of eligible) {
      try {
        await this.appointmentService.transitionStatus(a.id, AppointmentStatus.NO_SHOW, 'SYSTEM');
        this.logger.log(`Auto no-show: appointment ${a.id}`);
      } catch (err) {
        this.logger.error(
          `Failed to transition ${a.id} to NO_SHOW: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  }

  private async handleDailySweep(): Promise<void> {
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const stale = await this.prisma.appointment.findMany({
      where: {
        status: AppointmentStatus.SCHEDULED,
        createdAt: { lt: cutoff },
        deletedAt: null,
      },
      select: { id: true },
    });

    for (const a of stale) {
      try {
        await this.appointmentService.transitionStatus(a.id, AppointmentStatus.CANCELED, 'SYSTEM');
        this.logger.log(`Daily sweep: canceled stale appointment ${a.id}`);
      } catch (err) {
        this.logger.error(
          `Failed to transition ${a.id} to CANCELED: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  }
}
