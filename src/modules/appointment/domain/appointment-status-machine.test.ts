import { AppointmentStatus } from '@prisma/client';
import {
  ACTIVE_STATUSES,
  getTimestampField,
  isValidTransition,
} from './appointment-status-machine';

describe('appointment-status-machine', () => {
  describe('isValidTransition', () => {
    describe('valid transitions', () => {
      it('SCHEDULED -> CONFIRMATION_PENDING', () => {
        expect(
          isValidTransition(AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMATION_PENDING),
        ).toBe(true);
      });

      it('SCHEDULED -> CONFIRMED', () => {
        expect(isValidTransition(AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED)).toBe(
          true,
        );
      });

      it('CONFIRMATION_PENDING -> CONFIRMED', () => {
        expect(
          isValidTransition(AppointmentStatus.CONFIRMATION_PENDING, AppointmentStatus.CONFIRMED),
        ).toBe(true);
      });

      it('CONFIRMED -> IN_PROGRESS', () => {
        expect(isValidTransition(AppointmentStatus.CONFIRMED, AppointmentStatus.IN_PROGRESS)).toBe(
          true,
        );
      });

      it('IN_PROGRESS -> DONE', () => {
        expect(isValidTransition(AppointmentStatus.IN_PROGRESS, AppointmentStatus.DONE)).toBe(true);
      });

      it('CONFIRMED -> CANCELED', () => {
        expect(isValidTransition(AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELED)).toBe(
          true,
        );
      });
    });

    describe('invalid transitions', () => {
      it('DONE -> SCHEDULED', () => {
        expect(isValidTransition(AppointmentStatus.DONE, AppointmentStatus.SCHEDULED)).toBe(false);
      });

      it('CANCELED -> CONFIRMED', () => {
        expect(isValidTransition(AppointmentStatus.CANCELED, AppointmentStatus.CONFIRMED)).toBe(
          false,
        );
      });

      it('DONE -> IN_PROGRESS', () => {
        expect(isValidTransition(AppointmentStatus.DONE, AppointmentStatus.IN_PROGRESS)).toBe(
          false,
        );
      });
    });
  });

  describe('getTimestampField', () => {
    it('returns confirmationSentAt for CONFIRMATION_PENDING', () => {
      expect(getTimestampField(AppointmentStatus.CONFIRMATION_PENDING)).toBe('confirmationSentAt');
    });

    it('returns confirmedAt for CONFIRMED', () => {
      expect(getTimestampField(AppointmentStatus.CONFIRMED)).toBe('confirmedAt');
    });

    it('returns startedAt for IN_PROGRESS', () => {
      expect(getTimestampField(AppointmentStatus.IN_PROGRESS)).toBe('startedAt');
    });

    it('returns finishedAt for DONE', () => {
      expect(getTimestampField(AppointmentStatus.DONE)).toBe('finishedAt');
    });

    it('returns null for SCHEDULED', () => {
      expect(getTimestampField(AppointmentStatus.SCHEDULED)).toBe(null);
    });

    it('returns null for CANCELED', () => {
      expect(getTimestampField(AppointmentStatus.CANCELED)).toBe(null);
    });

    it('returns null for NO_SHOW', () => {
      expect(getTimestampField(AppointmentStatus.NO_SHOW)).toBe(null);
    });
  });

  describe('ACTIVE_STATUSES', () => {
    it('contains expected statuses', () => {
      expect(ACTIVE_STATUSES).toContain(AppointmentStatus.SCHEDULED);
      expect(ACTIVE_STATUSES).toContain(AppointmentStatus.CONFIRMATION_PENDING);
      expect(ACTIVE_STATUSES).toContain(AppointmentStatus.CONFIRMED);
      expect(ACTIVE_STATUSES).toContain(AppointmentStatus.IN_PROGRESS);
      expect(ACTIVE_STATUSES).toHaveLength(4);
    });

    it('does not contain terminal statuses', () => {
      expect(ACTIVE_STATUSES).not.toContain(AppointmentStatus.DONE);
      expect(ACTIVE_STATUSES).not.toContain(AppointmentStatus.CANCELED);
      expect(ACTIVE_STATUSES).not.toContain(AppointmentStatus.NO_SHOW);
    });
  });
});
