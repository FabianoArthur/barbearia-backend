import { computeReminderDelay } from './appointment-reminder.policy';

const MINUTE = 60_000;
const now = new Date('2026-03-16T12:00:00.000Z');
const inMinutes = (m: number) => new Date(now.getTime() + m * MINUTE);

describe('computeReminderDelay', () => {
  it('schedules the reminder 30 minutes before the appointment', () => {
    expect(computeReminderDelay(inMinutes(120), now)).toEqual({
      action: 'schedule',
      delay: 90 * MINUTE,
    });
  });

  it('fires immediately when booked less than 30 but at least 10 minutes ahead', () => {
    expect(computeReminderDelay(inMinutes(20), now)).toEqual({ action: 'schedule', delay: 0 });
    expect(computeReminderDelay(inMinutes(10), now)).toEqual({ action: 'schedule', delay: 0 });
  });

  it('skips when the appointment is less than 10 minutes away', () => {
    expect(computeReminderDelay(inMinutes(9), now)).toMatchObject({ action: 'skip' });
  });

  it('skips appointments in the past', () => {
    expect(computeReminderDelay(inMinutes(-5), now)).toEqual({
      action: 'skip',
      reason: 'Appointment is in the past',
    });
  });
});
