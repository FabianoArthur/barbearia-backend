import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { getJwtSecret } from '../../../../config/env';
import type { IAuthPayload } from '../../domain/interfaces/auth-service.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: (req: Request) => {
        const cookieToken = req?.cookies?.access_token as string | undefined;
        if (cookieToken) return cookieToken;
        return ExtractJwt.fromAuthHeaderAsBearerToken()(req);
      },
      ignoreExpiration: false,
      secretOrKey: getJwtSecret(),
      algorithms: ['HS256'],
    });
  }

  validate(payload: IAuthPayload): IAuthPayload {
    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      establishmentId: payload.establishmentId,
    };
  }
}
