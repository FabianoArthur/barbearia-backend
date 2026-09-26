import { HttpStatus } from '@nestjs/common';
import { DomainErrorCode } from './domain-error-code.enum';

export class DomainError extends Error {
  constructor(
    public readonly code: DomainErrorCode,
    message: string,
    public readonly httpStatus: number = HttpStatus.BAD_REQUEST,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'DomainError';
  }

  static notFound(code: DomainErrorCode, message: string, details?: Record<string, unknown>) {
    return new DomainError(code, message, HttpStatus.NOT_FOUND, details);
  }

  static conflict(code: DomainErrorCode, message: string, details?: Record<string, unknown>) {
    return new DomainError(code, message, HttpStatus.CONFLICT, details);
  }

  static forbidden(message = 'Forbidden') {
    return new DomainError(DomainErrorCode.FORBIDDEN, message, HttpStatus.FORBIDDEN);
  }

  static badRequest(code: DomainErrorCode, message: string, details?: Record<string, unknown>) {
    return new DomainError(code, message, HttpStatus.BAD_REQUEST, details);
  }
}
