import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { JwtPayload } from '../decorators/current-user.decorator';
import { resolveEstablishmentId } from './resolve-establishment';

const user = (role: Role, establishmentId: string | null): JwtPayload =>
  ({ sub: 'u1', email: 'u@test.com', role, establishmentId }) as JwtPayload;

describe('resolveEstablishmentId', () => {
  it('lets a SUPER_ADMIN pick any establishment or none (all)', () => {
    expect(resolveEstablishmentId('est-b', user(Role.SUPER_ADMIN, null))).toBe('est-b');
    expect(resolveEstablishmentId(undefined, user(Role.SUPER_ADMIN, null))).toBeUndefined();
  });

  it('defaults staff to their own establishment', () => {
    expect(resolveEstablishmentId(undefined, user(Role.MANAGER, 'est-a'))).toBe('est-a');
    expect(resolveEstablishmentId(undefined, user(Role.BARBER, 'est-a'))).toBe('est-a');
  });

  it('accepts staff asking for their own establishment explicitly', () => {
    expect(resolveEstablishmentId('est-a', user(Role.MANAGER, 'est-a'))).toBe('est-a');
  });

  it("forbids staff from reading another establishment's data", () => {
    expect(() => resolveEstablishmentId('est-b', user(Role.MANAGER, 'est-a'))).toThrow(
      ForbiddenException,
    );
    expect(() => resolveEstablishmentId('est-b', user(Role.BARBER, null))).toThrow(
      ForbiddenException,
    );
  });

  it('forbids staff without an assigned establishment instead of returning everything', () => {
    expect(() => resolveEstablishmentId(undefined, user(Role.MANAGER, null))).toThrow(
      ForbiddenException,
    );
    expect(() => resolveEstablishmentId(undefined, user(Role.BARBER, null))).toThrow(
      ForbiddenException,
    );
  });
});
