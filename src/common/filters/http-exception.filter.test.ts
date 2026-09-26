import { HttpException, HttpStatus } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common/interfaces';
import type { Response } from 'express';
import { DomainError, DomainErrorCode } from '../errors';
import { AllExceptionsFilter } from './http-exception.filter';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let mockResponse: jest.Mocked<Pick<Response, 'status' | 'json'>>;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
      }),
    } as unknown as ArgumentsHost;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('DomainError produces statusCode, code, message, details, timestamp', () => {
    const details = { entityId: '123' };
    const err = new DomainError(
      DomainErrorCode.BARBER_NOT_FOUND,
      'Barber not found',
      HttpStatus.NOT_FOUND,
      details,
    );

    filter.catch(err, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    const body = mockResponse.json.mock.calls[0][0];
    expect(body.statusCode).toBe(HttpStatus.NOT_FOUND);
    expect(body.code).toBe(DomainErrorCode.BARBER_NOT_FOUND);
    expect(body.message).toBe('Barber not found');
    expect(body.details).toEqual(details);
    expect(body.timestamp).toBeDefined();
    expect(typeof body.timestamp).toBe('string');
  });

  it('DomainError without details omits details from response', () => {
    const err = new DomainError(
      DomainErrorCode.VALIDATION_ERROR,
      'Invalid input',
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(err, mockHost);

    const body = mockResponse.json.mock.calls[0][0];
    expect(body.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(body.code).toBe(DomainErrorCode.VALIDATION_ERROR);
    expect(body.message).toBe('Invalid input');
    expect(body.details).toBeUndefined();
    expect(body.timestamp).toBeDefined();
  });

  it('HttpException produces statusCode, code HTTP_EXCEPTION, message, timestamp', () => {
    const err = new HttpException('Bad request', HttpStatus.BAD_REQUEST);

    filter.catch(err, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    const body = mockResponse.json.mock.calls[0][0];
    expect(body.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(body.code).toBe('HTTP_EXCEPTION');
    expect(body.message).toBe('Bad request');
    expect(body.timestamp).toBeDefined();
  });

  it('HttpException with object response extracts message', () => {
    const err = new HttpException({ message: 'Validation failed' }, HttpStatus.BAD_REQUEST);

    filter.catch(err, mockHost);

    const body = mockResponse.json.mock.calls[0][0];
    expect(body.message).toBe('Validation failed');
  });

  it('HttpException with array message joins with semicolon', () => {
    const err = new HttpException({ message: ['Error 1', 'Error 2'] }, HttpStatus.BAD_REQUEST);

    filter.catch(err, mockHost);

    const body = mockResponse.json.mock.calls[0][0];
    expect(body.message).toBe('Error 1; Error 2');
  });

  it('unknown exception produces 500 INTERNAL_ERROR', () => {
    const err = new Error('Unexpected error');

    filter.catch(err, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    const body = mockResponse.json.mock.calls[0][0];
    expect(body.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(body.code).toBe('INTERNAL_ERROR');
    expect(body.message).toBe('Internal server error');
    expect(body.timestamp).toBeDefined();
  });

  it('non-Error object produces 500 INTERNAL_ERROR', () => {
    filter.catch('string error', mockHost);

    const body = mockResponse.json.mock.calls[0][0];
    expect(body.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(body.code).toBe('INTERNAL_ERROR');
    expect(body.message).toBe('Internal server error');
  });
});
