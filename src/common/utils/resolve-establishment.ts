import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { JwtPayload } from '../decorators/current-user.decorator';

/**
 * Resolves which establishment a request is scoped to.
 * SUPER_ADMIN may pick any establishment (or none = all). Everyone else is pinned to
 * their own establishment; asking for a different one (or having none) is refused.
 */
export function resolveEstablishmentId(
  queryEstablishmentId: string | undefined,
  user: JwtPayload,
): string | undefined {
  if (user.role === Role.SUPER_ADMIN) return queryEstablishmentId;

  const own = user.establishmentId;
  if (!own) {
    throw new ForbiddenException('No establishment is assigned to this account');
  }
  if (queryEstablishmentId && queryEstablishmentId !== own) {
    throw new ForbiddenException('You can only access data from your own establishment');
  }
  return own;
}
