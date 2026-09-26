import { Injectable, type MessageEvent } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { finalize, Observable, Subject } from 'rxjs';
import { BookingStatusChangedEvent } from '../../../../common/events/domain-events';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';

@Injectable()
export class AppointmentSseService {
  private readonly subscriptions = new Map<string, Subject<MessageEvent>[]>();

  constructor(private readonly prisma: PrismaService) {}

  subscribe(barberId: string): Observable<MessageEvent> {
    const subject = new Subject<MessageEvent>();
    const list = this.subscriptions.get(barberId) ?? [];
    list.push(subject);
    this.subscriptions.set(barberId, list);

    return subject.pipe(
      finalize(() => {
        const subs = this.subscriptions.get(barberId);
        if (!subs) return;
        const idx = subs.indexOf(subject);
        if (idx !== -1) subs.splice(idx, 1);
        if (subs.length === 0) this.subscriptions.delete(barberId);
      }),
    );
  }

  emitToBarber(barberId: string, event: MessageEvent): void {
    const subs = this.subscriptions.get(barberId);
    if (!subs) return;
    for (const s of subs) s.next(event);
  }

  @OnEvent(BookingStatusChangedEvent.event)
  async onBookingStatusChanged(event: BookingStatusChangedEvent): Promise<void> {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: event.bookingId },
      select: { barberId: true },
    });
    if (!appointment) return;

    this.emitToBarber(appointment.barberId, {
      type: 'booking.status_changed',
      data: {
        bookingId: event.bookingId,
        status: event.toStatus,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
