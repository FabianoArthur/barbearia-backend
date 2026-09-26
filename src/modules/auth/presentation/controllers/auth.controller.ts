import { randomBytes } from 'node:crypto';
import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { CurrentUser, type JwtPayload } from '../../../../common/decorators/current-user.decorator';
import { SkipCsrf } from '../../../../common/decorators/skip-csrf.decorator';
import { AuthService } from '../../application/services/auth.service';
import type { ITokenPair, IUserInfo } from '../../domain/interfaces/auth-service.interface';
import { isPublicRegistrationAllowed } from '../../domain/policies/public-registration.policy';
import { LoginDto } from '../dtos/login.dto';
import { RegisterDto } from '../dtos/register.dto';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const ACCESS_MAX_AGE = 15 * 60 * 1000;
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @SkipCsrf()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Sets auth cookies and returns user info' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto);
    this.setAuthCookies(res, result.tokens);
    return { user: result.user };
  }

  @Post('register')
  @SkipCsrf()
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User created. Sets auth cookies and returns user info',
  })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  @ApiResponse({ status: 403, description: 'Public registration is disabled on this deployment' })
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    if (!isPublicRegistrationAllowed()) {
      throw new ForbiddenException('Public registration is disabled');
    }
    const result = await this.authService.register(dto);
    this.setAuthCookies(res, result.tokens);
    return { user: result.user };
  }

  @Post('refresh')
  @SkipCsrf()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token cookie' })
  @ApiResponse({ status: 200, description: 'New auth cookies set' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refresh_token as string | undefined;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const result = await this.authService.refresh(refreshToken);
    this.setAuthCookies(res, result.tokens);
    return { user: result.user };
  }

  @Post('logout')
  @SkipCsrf()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and clear auth cookies' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refresh_token as string | undefined;
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    this.clearAuthCookies(res);
    return { message: 'Logged out' };
  }

  @Get('csrf-token')
  @ApiOperation({ summary: 'Get a CSRF token' })
  @ApiResponse({
    status: 200,
    description: 'Returns a CSRF token and sets it as a cookie',
  })
  getCsrfToken(@Res({ passthrough: true }) res: Response) {
    const csrfToken = randomBytes(32).toString('hex');
    res.cookie('csrf_token', csrfToken, {
      httpOnly: false,
      secure: IS_PRODUCTION,
      sameSite: 'lax',
      path: '/',
      maxAge: REFRESH_MAX_AGE,
    });
    return { csrfToken };
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Get current authenticated user info' })
  @ApiResponse({ status: 200, description: 'Returns current user info' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  me(@CurrentUser() user: JwtPayload): IUserInfo {
    return {
      id: user.sub,
      name: '',
      email: user.email,
      role: user.role,
      establishmentId: user.establishmentId,
    };
  }

  private setAuthCookies(res: Response, tokens: ITokenPair): void {
    res.cookie('access_token', tokens.accessToken, {
      httpOnly: true,
      secure: IS_PRODUCTION,
      sameSite: 'lax',
      path: '/api',
      maxAge: ACCESS_MAX_AGE,
    });

    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: IS_PRODUCTION,
      sameSite: 'lax',
      path: '/api/auth/refresh',
      maxAge: REFRESH_MAX_AGE,
    });

    const csrfToken = randomBytes(32).toString('hex');
    res.cookie('csrf_token', csrfToken, {
      httpOnly: false,
      secure: IS_PRODUCTION,
      sameSite: 'lax',
      path: '/',
      maxAge: REFRESH_MAX_AGE,
    });
  }

  private clearAuthCookies(res: Response): void {
    res.clearCookie('access_token', { path: '/api' });
    res.clearCookie('refresh_token', { path: '/api/auth/refresh' });
    res.clearCookie('csrf_token', { path: '/' });
  }
}
