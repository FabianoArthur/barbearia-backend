import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { SKIP_CSRF_KEY } from '../decorators/skip-csrf.decorator';

const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const skipCsrf = this.reflector.getAllAndOverride<boolean>(SKIP_CSRF_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipCsrf) return true;

    const request = context.switchToHttp().getRequest<Request>();

    if (!STATE_CHANGING_METHODS.has(request.method)) return true;

    const hasBearerHeader = request.headers.authorization?.startsWith('Bearer ');
    if (hasBearerHeader) return true;

    const hasCookieAuth = Boolean(request.cookies?.access_token);
    if (!hasCookieAuth) return true;

    const csrfCookie = request.cookies?.csrf_token as string | undefined;
    const csrfHeader = request.headers['x-csrf-token'] as string | undefined;

    if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
      throw new ForbiddenException('Invalid or missing CSRF token');
    }

    return true;
  }
}
