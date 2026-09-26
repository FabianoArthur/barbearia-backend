const REMINDER_OFFSET_MS = 30 * 60 * 1000; // 30 minutes
const MIN_TIME_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

interface ScheduleAction {
  readonly action: 'schedule';
  readonly delay: number;
}

interface SkipAction {
  readonly action: 'skip';
  readonly reason: string;
}

export type ReminderPolicyResult = ScheduleAction | SkipAction;

/**
 * Pure function — zero framework dependencies.
 *
 * Decides whether to schedule a reminder and with what delay.
 *
 * - `reminderFiresAt = appointmentTime - 30 min`
 * - If delay <= 0 AND appointment < 10 min away → skip (too late)
 * - If delay <= 0 AND appointment >= 10 min away → fire immediately (delay = 0)
 * - If delay > 0 → schedule normally
 */
export function computeReminderDelay(
  appointmentTime: Date,
  now: Date = new Date(),
): ReminderPolicyResult {
  const reminderFiresAt = appointmentTime.getTime() - REMINDER_OFFSET_MS;
  const delay = reminderFiresAt - now.getTime();
  const timeUntilAppointment = appointmentTime.getTime() - now.getTime();

  if (timeUntilAppointment <= 0) {
    return { action: 'skip', reason: 'Appointment is in the past' };
  }

  if (delay <= 0 && timeUntilAppointment < MIN_TIME_THRESHOLD_MS) {
    return { action: 'skip', reason: 'Appointment is less than 10 minutes away' };
  }

  if (delay <= 0) {
    return { action: 'schedule', delay: 0 };
  }

  return { action: 'schedule', delay };
}
