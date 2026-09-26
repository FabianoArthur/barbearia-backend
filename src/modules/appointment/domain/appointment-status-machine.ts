import { AppointmentStatus } from '@prisma/client';

const allowedTransitions = new Map<AppointmentStatus, readonly AppointmentStatus[]>([
  [
    AppointmentStatus.SCHEDULED,
    [
      AppointmentStatus.CONFIRMATION_PENDING,
      AppointmentStatus.CONFIRMED,
      AppointmentStatus.IN_PROGRESS,
      AppointmentStatus.NO_SHOW,
      AppointmentStatus.CANCELED,
    ],
  ],
  [
    AppointmentStatus.CONFIRMATION_PENDING,
    [
      AppointmentStatus.CONFIRMED,
      AppointmentStatus.IN_PROGRESS,
      AppointmentStatus.NO_SHOW,
      AppointmentStatus.CANCELED,
    ],
  ],
  [
    AppointmentStatus.CONFIRMED,
    [AppointmentStatus.IN_PROGRESS, AppointmentStatus.NO_SHOW, AppointmentStatus.CANCELED],
  ],
  [AppointmentStatus.IN_PROGRESS, [AppointmentStatus.DONE, AppointmentStatus.CANCELED]],
  [AppointmentStatus.DONE, []],
  [AppointmentStatus.CANCELED, []],
  [AppointmentStatus.NO_SHOW, []],
]);

const TERMINAL_STATUSES: readonly AppointmentStatus[] = [
  AppointmentStatus.DONE,
  AppointmentStatus.CANCELED,
  AppointmentStatus.NO_SHOW,
] as const;

export function isTerminalStatus(status: AppointmentStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

export function isValidTransition(from: AppointmentStatus, to: AppointmentStatus): boolean {
  const allowed = allowedTransitions.get(from);
  if (!allowed) return false;
  return allowed.includes(to);
}

export function getTimestampField(
  status: AppointmentStatus,
): 'confirmedAt' | 'startedAt' | 'finishedAt' | 'confirmationSentAt' | null {
  switch (status) {
    case AppointmentStatus.CONFIRMATION_PENDING:
      return 'confirmationSentAt';
    case AppointmentStatus.CONFIRMED:
      return 'confirmedAt';
    case AppointmentStatus.IN_PROGRESS:
      return 'startedAt';
    case AppointmentStatus.DONE:
      return 'finishedAt';
    default:
      return null;
  }
}

/**
 * Statuses that represent an "active" appointment (occupying a time slot).
 */
export const ACTIVE_STATUSES: readonly AppointmentStatus[] = [
  AppointmentStatus.SCHEDULED,
  AppointmentStatus.CONFIRMATION_PENDING,
  AppointmentStatus.CONFIRMED,
  AppointmentStatus.IN_PROGRESS,
] as const;

/**
 * Statuses eligible for the "LATE" virtual filter:
 * appointment past its start time but never started.
 */
export const LATE_ELIGIBLE_STATUSES: readonly AppointmentStatus[] = [
  AppointmentStatus.SCHEDULED,
  AppointmentStatus.CONFIRMATION_PENDING,
  AppointmentStatus.CONFIRMED,
] as const;
