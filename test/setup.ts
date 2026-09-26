import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';

export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  configureApp(app);

  await app.init();
  return app;
}

export async function cleanDatabase(app: INestApplication): Promise<void> {
  const prisma = app.get(PrismaService);
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
  `;
  if (tables.length === 0) return;
  const list = tables.map(({ tablename }) => `"public"."${tablename}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
}

export interface TestUser {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    establishmentId: string | null;
  };
}

/** Valid CPFs for testing */
export const TEST_CPFS = {
  valid1: '12345678909',
  valid2: '98765432100',
  valid3: '52998224725',
  invalid: '00000000000',
} as const;

/** Extracts the access token the API sets as an httpOnly cookie on login/register/refresh. */
export function accessTokenOf(res: { headers: Record<string, unknown> }): string {
  const raw = res.headers['set-cookie'];
  const cookies = Array.isArray(raw) ? (raw as string[]) : typeof raw === 'string' ? [raw] : [];
  const match = cookies.map((c) => /^access_token=([^;]+)/.exec(c)).find(Boolean);
  if (!match) throw new Error('access_token cookie not set');
  return decodeURIComponent(match[1]);
}

/** Response body of login/register plus the access token from the cookie. */
export function asTestUser(res: {
  body: { user: TestUser['user'] };
  headers: Record<string, unknown>;
}): TestUser {
  return { user: res.body.user, accessToken: accessTokenOf(res) };
}

/**
 * ISO timestamp for the next given weekday (0 = Sunday) strictly after today, at the given
 * UTC time. Independent of the machine's local timezone so CI and laptops agree.
 */
export function nextWeekdayAt(weekday: number, utcTime: string): string {
  const now = new Date();
  const daysAhead = (weekday - now.getUTCDay() + 7) % 7 || 7;
  const date = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysAhead),
  );
  return `${date.toISOString().slice(0, 10)}T${utcTime}:00.000Z`;
}
