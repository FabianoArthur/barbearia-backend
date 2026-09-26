import { getJwtSecret, getThrottleConfig, validateEnv } from './env';

const VALID_KEY = 'a'.repeat(64);
const VALID_SECRET = 'x'.repeat(32);

function baseEnv(overrides: Record<string, string | undefined> = {}): NodeJS.ProcessEnv {
  return {
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
    JWT_SECRET: VALID_SECRET,
    ENCRYPTION_KEY: VALID_KEY,
    ...overrides,
  };
}

describe('getJwtSecret', () => {
  it('returns the configured secret', () => {
    expect(getJwtSecret(baseEnv())).toBe(VALID_SECRET);
  });

  it('throws when JWT_SECRET is missing (no insecure fallback)', () => {
    expect(() => getJwtSecret(baseEnv({ JWT_SECRET: undefined }))).toThrow(/JWT_SECRET/);
  });

  it('throws when JWT_SECRET is shorter than 32 characters', () => {
    expect(() => getJwtSecret(baseEnv({ JWT_SECRET: 'short' }))).toThrow(/at least 32/);
  });
});

describe('validateEnv', () => {
  it('accepts a complete environment', () => {
    expect(() => validateEnv(baseEnv())).not.toThrow();
  });

  it('reports every missing variable at once', () => {
    expect(() => validateEnv({})).toThrow(/DATABASE_URL[\s\S]*JWT_SECRET[\s\S]*ENCRYPTION_KEY/);
  });

  it('rejects an ENCRYPTION_KEY that is not 64 hex characters', () => {
    expect(() => validateEnv(baseEnv({ ENCRYPTION_KEY: 'change_me' }))).toThrow(/ENCRYPTION_KEY/);
  });
});

describe('getThrottleConfig', () => {
  it('defaults to 20 requests per 60 seconds', () => {
    expect(getThrottleConfig({})).toEqual({ ttl: 60_000, limit: 20 });
  });

  it('reads THROTTLE_TTL_MS and THROTTLE_LIMIT', () => {
    expect(getThrottleConfig({ THROTTLE_TTL_MS: '1000', THROTTLE_LIMIT: '500' })).toEqual({
      ttl: 1000,
      limit: 500,
    });
  });

  it('falls back to the defaults on invalid numbers', () => {
    expect(getThrottleConfig({ THROTTLE_TTL_MS: 'abc', THROTTLE_LIMIT: '-3' })).toEqual({
      ttl: 60_000,
      limit: 20,
    });
  });
});
