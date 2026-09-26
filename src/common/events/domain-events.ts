export class BookingCreatedEvent {
  static readonly event = 'booking.created';

  constructor(
    public readonly bookingId: string,
    public readonly establishmentId: string,
    public readonly barberId: string,
    public readonly clientId: string,
    public readonly serviceId: string,
    public readonly status: string,
    public readonly priceSnapshot: number,
    public readonly userId: string | null,
  ) {}
}

export class BookingStatusChangedEvent {
  static readonly event = 'booking.status_changed';

  constructor(
    public readonly bookingId: string,
    public readonly fromStatus: string,
    public readonly toStatus: string,
    public readonly userId: string | null,
  ) {}
}

export class BookingDeletedEvent {
  static readonly event = 'booking.deleted';

  constructor(
    public readonly bookingId: string,
    public readonly establishmentId: string,
    public readonly userId: string | null,
  ) {}
}

export class RefundCreatedEvent {
  static readonly event = 'refund.created';

  constructor(
    public readonly paymentId: string,
    public readonly appointmentId: string,
    public readonly refundAmount: number,
    public readonly reason: string | null,
    public readonly userId: string | null,
  ) {}
}

export class CommissionCalculatedEvent {
  static readonly event = 'commission.calculated';

  constructor(
    public readonly bookingId: string,
    public readonly barberId: string,
    public readonly commissionAmount: number,
    public readonly userId: string | null,
  ) {}
}
