process.env.DATABASE_URL ??=
  'postgresql://barbearia:barbearia@localhost:5432/barbearia_test?schema=public';
process.env.JWT_SECRET = 'e2e-test-jwt-secret-0123456789abcdef';
process.env.ENCRYPTION_KEY ??= '0'.repeat(64);
process.env.ALLOW_PUBLIC_REGISTRATION = 'true';
process.env.PORT = '0';
process.env.THROTTLE_LIMIT = '10000';
