import { createHash, randomBytes } from 'node:crypto';
import { ConflictException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import type {
  IAuthPayload,
  IAuthResult,
  ITokenPair,
  IUserInfo,
} from '../../domain/interfaces/auth-service.interface';
import {
  type IRefreshTokenRepository,
  REFRESH_TOKEN_REPOSITORY,
} from '../../domain/interfaces/refresh-token-repository.interface';
import type { LoginDto } from '../../presentation/dtos/login.dto';
import type { RegisterDto } from '../../presentation/dtos/register.dto';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepo: IRefreshTokenRepository,
  ) {}

  async login(dto: LoginDto): Promise<IAuthResult> {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const userInfo: IUserInfo = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      establishmentId: user.establishmentId,
    };

    const tokens = await this.generateTokenPair(userInfo);
    return { tokens, user: userInfo };
  }

  async register(dto: RegisterDto): Promise<IAuthResult> {
    const existingUser = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        role: dto.role,
        establishmentId: dto.establishmentId ?? null,
      },
    });

    const userInfo: IUserInfo = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      establishmentId: user.establishmentId,
    };

    const tokens = await this.generateTokenPair(userInfo);
    return { tokens, user: userInfo };
  }

  async refresh(oldRefreshToken: string): Promise<IAuthResult> {
    const tokenHash = this.hashToken(oldRefreshToken);
    const stored = await this.refreshTokenRepo.findByTokenHash(tokenHash);

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.refreshTokenRepo.revoke(stored.id);

    const user = await this.prisma.user.findFirst({
      where: { id: stored.userId, deletedAt: null },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const userInfo: IUserInfo = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      establishmentId: user.establishmentId,
    };

    const tokens = await this.generateTokenPair(userInfo);
    return { tokens, user: userInfo };
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.refreshTokenRepo.findByTokenHash(tokenHash);

    if (stored && !stored.revokedAt) {
      await this.refreshTokenRepo.revoke(stored.id);
    }
  }

  async logoutAll(userId: string): Promise<void> {
    await this.refreshTokenRepo.revokeAllForUser(userId);
  }

  private async generateTokenPair(user: IUserInfo): Promise<ITokenPair> {
    const payload: IAuthPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      establishmentId: user.establishmentId,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: ACCESS_TOKEN_EXPIRY,
    });

    const refreshToken = randomBytes(40).toString('hex');
    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await this.refreshTokenRepo.create(user.id, tokenHash, expiresAt);

    return { accessToken, refreshToken };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
