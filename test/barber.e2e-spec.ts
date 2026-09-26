import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { accessTokenOf, asTestUser, cleanDatabase, createTestApp, type TestUser } from './setup';

describe('Barber (e2e)', () => {
  let app: INestApplication;
  let superAdmin: TestUser;
  let establishmentId: string;
  let barberUserId: string;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await cleanDatabase(app);
    await app.close();
  });

  beforeEach(async () => {
    await cleanDatabase(app);

    const adminRes = await request(app.getHttpServer()).post('/api/auth/register').send({
      name: 'Super Admin',
      email: 'admin@test.com',
      password: 'password123',
      role: 'SUPER_ADMIN',
    });
    superAdmin = asTestUser(adminRes);

    const estRes = await request(app.getHttpServer())
      .post('/api/establishments')
      .set('Authorization', `Bearer ${superAdmin.accessToken}`)
      .send({ name: 'Test Shop' });
    establishmentId = estRes.body.id;

    const barberUserRes = await request(app.getHttpServer()).post('/api/auth/register').send({
      name: 'Barber User',
      email: 'barber@test.com',
      password: 'password123',
      role: 'BARBER',
      establishmentId,
    });
    barberUserId = barberUserRes.body.user.id;
  });

  describe('POST /api/barbers', () => {
    it('should create a barber', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/barbers')
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .send({ userId: barberUserId, establishmentId, commissionPercent: 60 })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.commissionPercent).toBe(60);
    });

    it('should reject BARBER role', async () => {
      const barberRes = await request(app.getHttpServer()).post('/api/auth/register').send({
        name: 'Another Barber',
        email: 'barber2@test.com',
        password: 'password123',
        role: 'BARBER',
      });

      await request(app.getHttpServer())
        .post('/api/barbers')
        .set('Authorization', `Bearer ${accessTokenOf(barberRes)}`)
        .send({ userId: barberUserId, establishmentId })
        .expect(403);
    });
  });

  describe('GET /api/barbers/establishment/:establishmentId', () => {
    it('should list barbers by establishment', async () => {
      await request(app.getHttpServer())
        .post('/api/barbers')
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .send({ userId: barberUserId, establishmentId });

      const res = await request(app.getHttpServer())
        .get(`/api/barbers/establishment/${establishmentId}`)
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .expect(200);

      expect(res.body).toHaveLength(1);
    });
  });

  describe('GET /api/barbers/:id', () => {
    it('should get barber by id', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/barbers')
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .send({ userId: barberUserId, establishmentId });

      const res = await request(app.getHttpServer())
        .get(`/api/barbers/${created.body.id}`)
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .expect(200);

      expect(res.body.id).toBe(created.body.id);
    });
  });

  describe('PATCH /api/barbers/:id', () => {
    it('should update barber commission', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/barbers')
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .send({ userId: barberUserId, establishmentId, commissionPercent: 50 });

      const res = await request(app.getHttpServer())
        .patch(`/api/barbers/${created.body.id}`)
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .send({ commissionPercent: 70 })
        .expect(200);

      expect(res.body.commissionPercent).toBe(70);
    });
  });

  describe('DELETE /api/barbers/:id', () => {
    it('should delete a barber', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/barbers')
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .send({ userId: barberUserId, establishmentId });

      await request(app.getHttpServer())
        .delete(`/api/barbers/${created.body.id}`)
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .expect(200);
    });
  });
});
