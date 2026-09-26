import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { accessTokenOf, asTestUser, cleanDatabase, createTestApp, type TestUser } from './setup';

describe('Establishment (e2e)', () => {
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

  describe('POST /api/establishments', () => {
    it('should create an establishment', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/establishments')
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .send({ name: 'Test Barber Shop', lat: -23.55, lng: -46.63 })
        .expect(201);

      expect(res.body.name).toBe('Test Barber Shop');
      expect(res.body.id).toBeDefined();
    });

    it('should reject BARBER role', async () => {
      const barberRes = await request(app.getHttpServer()).post('/api/auth/register').send({
        name: 'Barber',
        email: 'barber@test.com',
        password: 'password123',
        role: 'BARBER',
      });

      await request(app.getHttpServer())
        .post('/api/establishments')
        .set('Authorization', `Bearer ${accessTokenOf(barberRes)}`)
        .send({ name: 'Forbidden Shop' })
        .expect(403);
    });

    it('should reject invalid payload', async () => {
      await request(app.getHttpServer())
        .post('/api/establishments')
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .send({})
        .expect(400);
    });
  });

  describe('GET /api/establishments', () => {
    it('should list all establishments', async () => {
      await request(app.getHttpServer())
        .post('/api/establishments')
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .send({ name: 'Shop A' });

      await request(app.getHttpServer())
        .post('/api/establishments')
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .send({ name: 'Shop B' });

      const res = await request(app.getHttpServer())
        .get('/api/establishments')
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .expect(200);

      expect(res.body).toHaveLength(2);
    });
  });

  describe('GET /api/establishments/:id', () => {
    it('should return an establishment by id', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/establishments')
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .send({ name: 'Single Shop' });

      const res = await request(app.getHttpServer())
        .get(`/api/establishments/${created.body.id}`)
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .expect(200);

      expect(res.body.name).toBe('Single Shop');
    });
  });

  describe('PATCH /api/establishments/:id', () => {
    it('should update an establishment', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/establishments')
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .send({ name: 'Old Name' });

      const res = await request(app.getHttpServer())
        .patch(`/api/establishments/${created.body.id}`)
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .send({ name: 'New Name' })
        .expect(200);

      expect(res.body.name).toBe('New Name');
    });
  });

  describe('DELETE /api/establishments/:id', () => {
    it('should delete an establishment (SUPER_ADMIN)', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/establishments')
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .send({ name: 'To Delete' });

      await request(app.getHttpServer())
        .delete(`/api/establishments/${created.body.id}`)
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .expect(200);
    });

    it('should reject MANAGER for delete', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/establishments')
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .send({ name: 'Protected' });

      const managerRes = await request(app.getHttpServer()).post('/api/auth/register').send({
        name: 'Manager',
        email: 'manager@test.com',
        password: 'password123',
        role: 'MANAGER',
      });

      await request(app.getHttpServer())
        .delete(`/api/establishments/${created.body.id}`)
        .set('Authorization', `Bearer ${accessTokenOf(managerRes)}`)
        .expect(403);
    });
  });
});
