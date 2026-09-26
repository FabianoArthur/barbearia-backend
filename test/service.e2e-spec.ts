import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { accessTokenOf, asTestUser, cleanDatabase, createTestApp, type TestUser } from './setup';

describe('Service (e2e)', () => {
  let app: INestApplication;
  let superAdmin: TestUser;
  let establishmentId: string;

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
  });

  describe('POST /api/services', () => {
    it('should create a service', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/services')
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .send({
          establishmentId,
          name: 'Haircut',
          price: 35.0,
          durationMinutes: 30,
        })
        .expect(201);

      expect(res.body.name).toBe('Haircut');
      expect(res.body.price).toBe(35.0);
      expect(res.body.durationMinutes).toBe(30);
    });

    it('should reject invalid payload', async () => {
      await request(app.getHttpServer())
        .post('/api/services')
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .send({ name: 'No Price' })
        .expect(400);
    });

    it('should reject BARBER role', async () => {
      const barberRes = await request(app.getHttpServer()).post('/api/auth/register').send({
        name: 'Barber',
        email: 'barber@test.com',
        password: 'password123',
        role: 'BARBER',
      });

      await request(app.getHttpServer())
        .post('/api/services')
        .set('Authorization', `Bearer ${accessTokenOf(barberRes)}`)
        .send({ establishmentId, name: 'Haircut', price: 35, durationMinutes: 30 })
        .expect(403);
    });
  });

  describe('GET /api/services/establishment/:establishmentId', () => {
    it('should list services by establishment', async () => {
      await request(app.getHttpServer())
        .post('/api/services')
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .send({ establishmentId, name: 'Cut', price: 30, durationMinutes: 30 });

      await request(app.getHttpServer())
        .post('/api/services')
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .send({ establishmentId, name: 'Beard', price: 20, durationMinutes: 15 });

      const res = await request(app.getHttpServer())
        .get(`/api/services/establishment/${establishmentId}`)
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .expect(200);

      expect(res.body).toHaveLength(2);
    });
  });

  describe('GET /api/services/:id', () => {
    it('should get a service by id', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/services')
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .send({ establishmentId, name: 'Haircut', price: 35, durationMinutes: 30 });

      const res = await request(app.getHttpServer())
        .get(`/api/services/${created.body.id}`)
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .expect(200);

      expect(res.body.name).toBe('Haircut');
    });
  });

  describe('PATCH /api/services/:id', () => {
    it('should update a service', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/services')
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .send({ establishmentId, name: 'Old Name', price: 25, durationMinutes: 20 });

      const res = await request(app.getHttpServer())
        .patch(`/api/services/${created.body.id}`)
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .send({ name: 'New Name', price: 40 })
        .expect(200);

      expect(res.body.name).toBe('New Name');
      expect(res.body.price).toBe(40);
    });
  });

  describe('DELETE /api/services/:id', () => {
    it('should delete a service', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/services')
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .send({ establishmentId, name: 'To Delete', price: 10, durationMinutes: 10 });

      await request(app.getHttpServer())
        .delete(`/api/services/${created.body.id}`)
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .expect(200);
    });
  });
});
