const MIN_JWT_SECRET_LENGTH = 32;
const ENCRYPTION_KEY_PATTERN = /^[0-9a-f]{64}$/i;

/**
 * Returns the JWT signing secret. There is deliberately no fallback: a missing or weak
 * secret would let anyone forge tokens, so the app refuses to start instead.
 */
export function getJwtSecret(env: NodeJS.ProcessEnv = process.env): string {
  const secret = env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  if (secret.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(`JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters long`);
  }
  return secret;
}

/**
 * Fails fast at bootstrap with every configuration problem listed at once.
 */
export function validateEnv(env: NodeJS.ProcessEnv = process.env): void {
  const problems: string[] = [];

  if (!env.DATABASE_URL) problems.push('DATABASE_URL is not set');

  try {
    getJwtSecret(env);
  } catch (error) {
    problems.push((error as Error).message);
  }

  if (!env.ENCRYPTION_KEY) {
    problems.push('ENCRYPTION_KEY is not set');
  } else if (!ENCRYPTION_KEY_PATTERN.test(env.ENCRYPTION_KEY)) {
    problems.push('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
  }

  if (problems.length > 0) {
    throw new Error(`Invalid environment configuration:\n- ${problems.join('\n- ')}`);
  }
}

const DEFAULT_THROTTLE = { ttl: 60_000, limit: 20 } as const;

function positiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * Global rate limit (per client IP). Defaults to 20 requests / 60 s; the e2e suite raises
 * it so a single test runner is not throttled.
 */
export function getThrottleConfig(env: NodeJS.ProcessEnv = process.env): {
  ttl: number;
  limit: number;
} {
  return {
    ttl: positiveInt(env.THROTTLE_TTL_MS, DEFAULT_THROTTLE.ttl),
    limit: positiveInt(env.THROTTLE_LIMIT, DEFAULT_THROTTLE.limit),
  };
}
