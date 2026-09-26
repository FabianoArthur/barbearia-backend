import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { asTestUser, cleanDatabase, createTestApp, type TestUser } from './setup';

describe('Schedule (e2e)', () => {
  let app: INestApplication;
  let superAdmin: TestUser;
  let barberId: string;

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
    const establishmentId = estRes.body.id;

    const barberUserRes = await request(app.getHttpServer()).post('/api/auth/register').send({
      name: 'Barber',
      email: 'barber@test.com',
      password: 'password123',
      role: 'BARBER',
      establishmentId,
    });

    const barberRes = await request(app.getHttpServer())
      .post('/api/barbers')
      .set('Authorization', `Bearer ${superAdmin.accessToken}`)
      .send({ userId: barberUserRes.body.user.id, establishmentId });
    barberId = barberRes.body.id;
  });

  // --- Working Hours ---

  describe('POST /api/schedule/working-hours', () => {
    it('should create a working hour', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/schedule/working-hours')
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .send({ barberId, weekday: 1, startTime: '09:00', endTime: '18:00' })
        .expect(201);

      expect(res.body.barberId).toBe(barberId);
      expect(res.body.weekday).toBe(1);
    });

    it('should reject invalid time format', async () => {
      await request(app.getHttpServer())
        .post('/api/schedule/working-hours')
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .send({ barberId, weekday: 1, startTime: '9am', endTime: '6pm' })
        .expect(400);
    });
  });

  describe('GET /api/schedule/working-hours/:barberId', () => {
    it('should list working hours for a barber', async () => {
      await request(app.getHttpServer())
        .post('/api/schedule/working-hours')
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .send({ barberId, weekday: 1, startTime: '09:00', endTime: '18:00' });

      const res = await request(app.getHttpServer())
        .get(`/api/schedule/working-hours/${barberId}`)
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .expect(200);

      expect(res.body).toHaveLength(1);
    });
  });

  describe('DELETE /api/schedule/working-hours/:id', () => {
    it('should delete a working hour', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/schedule/working-hours')
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .send({ barberId, weekday: 2, startTime: '08:00', endTime: '17:00' });

      await request(app.getHttpServer())
        .delete(`/api/schedule/working-hours/${created.body.id}`)
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .expect(200);
    });
  });

  // --- Time Off ---

  describe('POST /api/schedule/time-off', () => {
    it('should create a time off', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/schedule/time-off')
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .send({ barberId, date: '2026-03-15', reason: 'Vacation' })
        .expect(201);

      expect(res.body.barberId).toBe(barberId);
      expect(res.body.reason).toBe('Vacation');
    });
  });

  describe('GET /api/schedule/time-off/:barberId', () => {
    it('should list time offs for a barber', async () => {
      await request(app.getHttpServer())
        .post('/api/schedule/time-off')
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .send({ barberId, date: '2026-03-15' });

      const res = await request(app.getHttpServer())
        .get(`/api/schedule/time-off/${barberId}`)
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .expect(200);

      expect(res.body).toHaveLength(1);
    });
  });

  describe('DELETE /api/schedule/time-off/:id', () => {
    it('should delete a time off', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/schedule/time-off')
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .send({ barberId, date: '2026-04-01' });

      await request(app.getHttpServer())
        .delete(`/api/schedule/time-off/${created.body.id}`)
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .expect(200);
    });
  });

  // --- Schedule Override ---

  describe('POST /api/schedule/overrides', () => {
    it('should create a schedule override', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/schedule/overrides')
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .send({
          barberId,
          startDate: '2026-03-01',
          endDate: '2026-03-31',
          startTime: '10:00',
          endTime: '14:00',
          reason: 'Half-day March',
        })
        .expect(201);

      expect(res.body.barberId).toBe(barberId);
      expect(res.body.reason).toBe('Half-day March');
    });
  });

  describe('GET /api/schedule/overrides/:barberId', () => {
    it('should list overrides for a barber', async () => {
      await request(app.getHttpServer())
        .post('/api/schedule/overrides')
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .send({
          barberId,
          startDate: '2026-03-01',
          endDate: '2026-03-31',
          startTime: '10:00',
          endTime: '14:00',
        });

      const res = await request(app.getHttpServer())
        .get(`/api/schedule/overrides/${barberId}`)
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .expect(200);

      expect(res.body).toHaveLength(1);
    });
  });

  describe('DELETE /api/schedule/overrides/:id', () => {
    it('should delete a schedule override', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/schedule/overrides')
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .send({
          barberId,
          startDate: '2026-04-01',
          endDate: '2026-04-30',
          startTime: '09:00',
          endTime: '12:00',
        });

      await request(app.getHttpServer())
        .delete(`/api/schedule/overrides/${created.body.id}`)
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .expect(200);
    });
  });
});
