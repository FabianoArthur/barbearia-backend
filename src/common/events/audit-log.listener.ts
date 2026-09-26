import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import {
  BookingCreatedEvent,
  BookingDeletedEvent,
  BookingStatusChangedEvent,
  CommissionCalculatedEvent,
  RefundCreatedEvent,
} from './domain-events';

@Injectable()
export class AuditLogListener {
  private readonly logger = new Logger(AuditLogListener.name);

  constructor(private readonly prisma: PrismaService) {}

  @OnEvent(BookingCreatedEvent.event)
  async onBookingCreated(event: BookingCreatedEvent) {
    await this.writeLog({
      entityType: 'booking',
      entityId: event.bookingId,
      action: 'created',
      oldValue: null,
      newValue: {
        status: event.status,
        establishmentId: event.establishmentId,
        barberId: event.barberId,
        clientId: event.clientId,
        serviceId: event.serviceId,
        priceSnapshot: event.priceSnapshot,
      },
      userId: event.userId,
    });
  }

  @OnEvent(BookingStatusChangedEvent.event)
  async onBookingStatusChanged(event: BookingStatusChangedEvent) {
    await this.writeLog({
      entityType: 'booking',
      entityId: event.bookingId,
      action: 'status_changed',
      oldValue: { status: event.fromStatus },
      newValue: { status: event.toStatus },
      userId: event.userId,
    });
  }

  @OnEvent(BookingDeletedEvent.event)
  async onBookingDeleted(event: BookingDeletedEvent) {
    await this.writeLog({
      entityType: 'booking',
      entityId: event.bookingId,
      action: 'deleted',
      oldValue: { establishmentId: event.establishmentId },
      newValue: { deletedAt: new Date().toISOString() },
      userId: event.userId,
    });
  }

  @OnEvent(RefundCreatedEvent.event)
  async onRefundCreated(event: RefundCreatedEvent) {
    await this.writeLog({
      entityType: 'refund',
      entityId: event.paymentId,
      action: 'created',
      oldValue: null,
      newValue: {
        appointmentId: event.appointmentId,
        refundAmount: event.refundAmount,
        reason: event.reason,
      },
      userId: event.userId,
    });
  }

  @OnEvent(CommissionCalculatedEvent.event)
  async onCommissionCalculated(event: CommissionCalculatedEvent) {
    await this.writeLog({
      entityType: 'commission',
      entityId: event.bookingId,
      action: 'calculated',
      oldValue: null,
      newValue: {
        barberId: event.barberId,
        commissionAmount: event.commissionAmount,
      },
      userId: event.userId,
    });
  }

  private async writeLog(data: {
    entityType: string;
    entityId: string;
    action: string;
    oldValue: Record<string, unknown> | null;
    newValue: Record<string, unknown>;
    userId: string | null;
  }) {
    try {
      await this.prisma.auditLog.create({
        data: {
          entityType: data.entityType,
          entityId: data.entityId,
          action: data.action,
          oldValue: (data.oldValue ?? undefined) as Prisma.InputJsonValue | undefined,
          newValue: data.newValue as Prisma.InputJsonValue,
          userId: data.userId,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to write audit log: ${data.entityType}/${data.entityId}/${data.action}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
