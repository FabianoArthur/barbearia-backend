import { HttpStatus } from '@nestjs/common';
import { DomainError } from './domain.error';
import { DomainErrorCode } from './domain-error-code.enum';

describe('DomainError', () => {
  describe('constructor', () => {
    it('creates error with code, message, httpStatus, and details', () => {
      const details = { entityId: '123' };
      const err = new DomainError(
        DomainErrorCode.BARBER_NOT_FOUND,
        'Barber not found',
        HttpStatus.NOT_FOUND,
        details,
      );

      expect(err.code).toBe(DomainErrorCode.BARBER_NOT_FOUND);
      expect(err.message).toBe('Barber not found');
      expect(err.httpStatus).toBe(HttpStatus.NOT_FOUND);
      expect(err.details).toEqual(details);
      expect(err.name).toBe('DomainError');
    });

    it('defaults httpStatus to 400 when not provided', () => {
      const err = new DomainError(DomainErrorCode.VALIDATION_ERROR, 'Invalid input');
      expect(err.httpStatus).toBe(HttpStatus.BAD_REQUEST);
    });
  });

  describe('static factory methods', () => {
    it('notFound returns error with 404', () => {
      const err = DomainError.notFound(DomainErrorCode.BOOKING_NOT_FOUND, 'Booking not found');
      expect(err.httpStatus).toBe(HttpStatus.NOT_FOUND);
      expect(err.code).toBe(DomainErrorCode.BOOKING_NOT_FOUND);
      expect(err.message).toBe('Booking not found');
    });

    it('conflict returns error with 409', () => {
      const err = DomainError.conflict(DomainErrorCode.BOOKING_CONFLICT, 'Time slot taken');
      expect(err.httpStatus).toBe(HttpStatus.CONFLICT);
      expect(err.code).toBe(DomainErrorCode.BOOKING_CONFLICT);
    });

    it('forbidden returns error with 403', () => {
      const err = DomainError.forbidden();
      expect(err.httpStatus).toBe(HttpStatus.FORBIDDEN);
      expect(err.code).toBe(DomainErrorCode.FORBIDDEN);
      expect(err.message).toBe('Forbidden');
    });

    it('forbidden accepts custom message', () => {
      const err = DomainError.forbidden('Access denied');
      expect(err.message).toBe('Access denied');
    });

    it('badRequest returns error with 400', () => {
      const err = DomainError.badRequest(DomainErrorCode.INVALID_PHONE, 'Invalid phone format');
      expect(err.httpStatus).toBe(HttpStatus.BAD_REQUEST);
      expect(err.code).toBe(DomainErrorCode.INVALID_PHONE);
    });
  });
});
