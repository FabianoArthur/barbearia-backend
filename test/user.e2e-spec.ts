import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { accessTokenOf, asTestUser, cleanDatabase, createTestApp, type TestUser } from './setup';

describe('User (e2e)', () => {
  let app: INestApplication;
  let superAdmin: TestUser;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await cleanDatabase(app);
    await app.close();
  });

  beforeEach(async () => {
    await cleanDatabase(app);

    const res = await request(app.getHttpServer()).post('/api/auth/register').send({
      name: 'Super Admin',
      email: 'admin@test.com',
      password: 'password123',
      role: 'SUPER_ADMIN',
    });
    superAdmin = asTestUser(res);
  });

  describe('GET /api/users/me', () => {
    it('should return the authenticated user', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .expect(200);

      expect(res.body.email).toBe('admin@test.com');
    });

    it('should reject unauthenticated request', async () => {
      await request(app.getHttpServer()).get('/api/users/me').expect(401);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return a user by id (SUPER_ADMIN)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/users/${superAdmin.user.id}`)
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .expect(200);

      expect(res.body.id).toBe(superAdmin.user.id);
    });

    it('should reject BARBER role', async () => {
      const barberRes = await request(app.getHttpServer()).post('/api/auth/register').send({
        name: 'Barber',
        email: 'barber@test.com',
        password: 'password123',
        role: 'BARBER',
      });

      await request(app.getHttpServer())
        .get(`/api/users/${superAdmin.user.id}`)
        .set('Authorization', `Bearer ${accessTokenOf(barberRes)}`)
        .expect(403);
    });
  });

  describe('PATCH /api/users/:id', () => {
    it('should update a user', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/users/${superAdmin.user.id}`)
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .send({ name: 'Updated Name' })
        .expect(200);

      expect(res.body.name).toBe('Updated Name');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete a user (SUPER_ADMIN)', async () => {
      const victimRes = await request(app.getHttpServer()).post('/api/auth/register').send({
        name: 'To Delete',
        email: 'delete@test.com',
        password: 'password123',
        role: 'BARBER',
      });

      await request(app.getHttpServer())
        .delete(`/api/users/${victimRes.body.user.id}`)
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .expect(200);
    });

    it('should reject MANAGER role for delete', async () => {
      const managerRes = await request(app.getHttpServer()).post('/api/auth/register').send({
        name: 'Manager',
        email: 'manager@test.com',
        password: 'password123',
        role: 'MANAGER',
      });

      await request(app.getHttpServer())
        .delete(`/api/users/${superAdmin.user.id}`)
        .set('Authorization', `Bearer ${accessTokenOf(managerRes)}`)
        .expect(403);
    });
  });
});
