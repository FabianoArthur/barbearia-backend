import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { accessTokenOf, cleanDatabase, createTestApp } from './setup';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await cleanDatabase(app);
    await app.close();
  });

  beforeEach(async () => {
    await cleanDatabase(app);
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@test.com',
          password: 'password123',
          role: 'SUPER_ADMIN',
        })
        .expect(201);

      expect(accessTokenOf(res)).toBeTruthy();
      expect(res.body.user.email).toBe('test@test.com');
      expect(res.body.user.role).toBe('SUPER_ADMIN');
    });

    it('should reject duplicate email', async () => {
      const payload = {
        name: 'Test User',
        email: 'dup@test.com',
        password: 'password123',
        role: 'BARBER',
      };

      await request(app.getHttpServer()).post('/api/auth/register').send(payload).expect(201);

      await request(app.getHttpServer()).post('/api/auth/register').send(payload).expect(409);
    });

    it('should reject invalid payload', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ name: 'No Email' })
        .expect(400);
    });

    it('should reject CLIENT role (no longer valid)', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          name: 'Client',
          email: 'client@test.com',
          password: 'password123',
          role: 'CLIENT',
        })
        .expect(400);
    });
  });

  describe('public registration gate', () => {
    // These tests flip process.env for the shared app. That is safe because the policy reads
    // the env on every request and the e2e suite runs with --runInBand; keep it that way.
    const payload = {
      name: 'Intruder',
      email: 'intruder@test.com',
      password: 'password123',
      role: 'SUPER_ADMIN',
    };

    afterEach(() => {
      process.env.ALLOW_PUBLIC_REGISTRATION = 'true';
    });

    it('returns 403 when ALLOW_PUBLIC_REGISTRATION is false', async () => {
      process.env.ALLOW_PUBLIC_REGISTRATION = 'false';

      await request(app.getHttpServer()).post('/api/auth/register').send(payload).expect(403);
    });

    it('is closed by default in production', async () => {
      const previousNodeEnv = process.env.NODE_ENV;
      delete process.env.ALLOW_PUBLIC_REGISTRATION;
      process.env.NODE_ENV = 'production';
      try {
        await request(app.getHttpServer()).post('/api/auth/register').send(payload).expect(403);
      } finally {
        process.env.NODE_ENV = previousNodeEnv;
      }
    });

    it('returns 201 when ALLOW_PUBLIC_REGISTRATION is true', async () => {
      await request(app.getHttpServer()).post('/api/auth/register').send(payload).expect(201);
    });
  });

  describe('security headers', () => {
    it('sends helmet headers and hides the framework', async () => {
      const res = await request(app.getHttpServer()).get('/api/auth/csrf-token');

      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-powered-by']).toBeUndefined();
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app.getHttpServer()).post('/api/auth/register').send({
        name: 'Login User',
        email: 'login@test.com',
        password: 'password123',
        role: 'BARBER',
      });
    });

    it('should login with valid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'login@test.com', password: 'password123' })
        .expect(200);

      expect(accessTokenOf(res)).toBeTruthy();
      expect(res.body.user.email).toBe('login@test.com');
    });

    it('should reject invalid password', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'login@test.com', password: 'wrong' })
        .expect(401);
    });

    it('should reject non-existent user', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'ghost@test.com', password: 'password123' })
        .expect(401);
    });
  });
});
