import { PaymentStatus } from '@prisma/client';

const allowedTransitions = new Map<PaymentStatus, readonly PaymentStatus[]>([
  [PaymentStatus.PENDING, [PaymentStatus.COMPLETED, PaymentStatus.FAILED]],
  [PaymentStatus.COMPLETED, [PaymentStatus.REFUNDED]],
  [PaymentStatus.REFUNDED, []],
  [PaymentStatus.FAILED, []],
]);

const TERMINAL_STATUSES: readonly PaymentStatus[] = [
  PaymentStatus.REFUNDED,
  PaymentStatus.FAILED,
] as const;

export function isTerminalPaymentStatus(status: PaymentStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

export function isValidPaymentTransition(from: PaymentStatus, to: PaymentStatus): boolean {
  const allowed = allowedTransitions.get(from);
  if (!allowed) return false;
  return allowed.includes(to);
}
