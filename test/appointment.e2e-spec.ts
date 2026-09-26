import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  asTestUser,
  cleanDatabase,
  createTestApp,
  nextWeekdayAt,
  TEST_CPFS,
  type TestUser,
} from './setup';

describe('Appointment (e2e)', () => {
  let app: INestApplication;
  let superAdmin: TestUser;
  let establishmentId: string;
  let barberId: string;
  let clientId: string;
  let serviceId: string;

  const MONDAY = 1;
  // Working hours are interpreted in APP_TIMEZONE (America/Sao_Paulo, UTC-3).
  const mondayAt10 = () => nextWeekdayAt(MONDAY, '13:00');
  const mondayAt11 = () => nextWeekdayAt(MONDAY, '14:00');

  const auth = () => ({ Authorization: `Bearer ${superAdmin.accessToken}` });

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await cleanDatabase(app);
    await app.close();
  });

  beforeEach(async () => {
    await cleanDatabase(app);
    const http = app.getHttpServer();

    const adminRes = await request(http).post('/api/auth/register').send({
      name: 'Super Admin',
      email: 'admin@test.com',
      password: 'password123',
      role: 'SUPER_ADMIN',
    });
    superAdmin = asTestUser(adminRes);

    const estRes = await request(http)
      .post('/api/establishments')
      .set(auth())
      .send({ name: 'Test Shop' });
    establishmentId = estRes.body.id;

    const barberUserRes = await request(http).post('/api/auth/register').send({
      name: 'Barber',
      email: 'barber@test.com',
      password: 'password123',
      role: 'BARBER',
      establishmentId,
    });

    const barberRes = await request(http)
      .post('/api/barbers')
      .set(auth())
      .send({ userId: barberUserRes.body.user.id, establishmentId });
    barberId = barberRes.body.id;

    await request(http)
      .post('/api/schedule/working-hours')
      .set(auth())
      .send({ barberId, weekday: MONDAY, startTime: '08:00', endTime: '18:00' })
      .expect(201);

    const clientRes = await request(http)
      .post('/api/clients')
      .set(auth())
      .send({ establishmentId, name: 'Client', cpf: TEST_CPFS.valid1 });
    clientId = clientRes.body.id;

    const serviceRes = await request(http)
      .post('/api/services')
      .set(auth())
      .send({ establishmentId, name: 'Haircut', price: 35, durationMinutes: 30 });
    serviceId = serviceRes.body.id;

    await request(http)
      .put(`/api/barbers/${barberId}/services`)
      .set(auth())
      .send({ serviceIds: [serviceId] })
      .expect(200);
  });

  async function createAppointment(startsAt = mondayAt10()) {
    return request(app.getHttpServer())
      .post('/api/appointments')
      .set(auth())
      .send({ establishmentId, barberId, clientId, serviceId, startsAt })
      .expect(201);
  }

  describe('POST /api/appointments (authenticated)', () => {
    it('creates an appointment in SCHEDULED status', async () => {
      const res = await createAppointment();

      expect(res.body.id).toBeDefined();
      expect(res.body.status).toBe('SCHEDULED');
      expect(res.body.barberId).toBe(barberId);
    });

    it('never exposes the raw client CPF', async () => {
      const res = await createAppointment();

      expect(JSON.stringify(res.body)).not.toContain(TEST_CPFS.valid1);
    });

    it('rejects an invalid payload', async () => {
      await request(app.getHttpServer())
        .post('/api/appointments')
        .set(auth())
        .send({ barberId })
        .expect(400);
    });

    it('rejects a service the barber does not offer', async () => {
      const otherService = await request(app.getHttpServer())
        .post('/api/services')
        .set(auth())
        .send({ establishmentId, name: 'Beard', price: 20, durationMinutes: 20 });

      await request(app.getHttpServer())
        .post('/api/appointments')
        .set(auth())
        .send({
          establishmentId,
          barberId,
          clientId,
          serviceId: otherService.body.id,
          startsAt: mondayAt10(),
        })
        .expect(400);
    });

    it('rejects an unauthenticated request', async () => {
      await request(app.getHttpServer())
        .post('/api/appointments')
        .send({ establishmentId, barberId, clientId, serviceId, startsAt: mondayAt10() })
        .expect(401);
    });
  });

  describe('POST /api/public/booking/appointments', () => {
    const book = (startsAt: string, clientCpf: string, clientName = 'Public Client') =>
      request(app.getHttpServer()).post('/api/public/booking/appointments').send({
        establishmentId,
        barberId,
        serviceId,
        startsAt,
        clientName,
        clientCpf,
        clientPhone: '11999999999',
      });

    it('books an appointment and returns a confirmation code', async () => {
      const res = await book(mondayAt10(), TEST_CPFS.valid2).expect(201);

      expect(res.body.appointmentId).toBeDefined();
      expect(res.body.code).toEqual(expect.any(String));
    });

    it('reuses the existing client for the same CPF', async () => {
      await book(mondayAt10(), TEST_CPFS.valid3, 'Repeat Client').expect(201);
      await book(mondayAt11(), TEST_CPFS.valid3, 'Repeat Client').expect(201);

      const clients = await request(app.getHttpServer())
        .get(`/api/clients/establishment/${establishmentId}`)
        .set(auth())
        .expect(200);
      const list = Array.isArray(clients.body) ? clients.body : clients.body.data;
      expect(list.filter((c: { name: string }) => c.name === 'Repeat Client')).toHaveLength(1);
    });

    it('rejects an invalid CPF', async () => {
      await book(mondayAt10(), TEST_CPFS.invalid).expect(400);
    });

    it('rejects a slot that is already taken', async () => {
      await book(mondayAt10(), TEST_CPFS.valid2, 'Alice Silva').expect(201);
      await book(mondayAt10(), TEST_CPFS.valid3, 'Bruno Souza').expect(409);
    });

    it('confirms the booking by code', async () => {
      const booked = await book(mondayAt10(), TEST_CPFS.valid2).expect(201);

      const res = await request(app.getHttpServer())
        .post(`/api/public/booking/appointments/${booked.body.code}/confirm`)
        .expect(201);

      expect(res.body).toEqual({ confirmed: true });
    });

    it('rate-limits confirmation attempts (5 per 10 minutes per client)', async () => {
      // The throttle window is shared with the other confirm calls in this suite,
      // so assert on the limit being reached rather than on an exact position.
      const http = app.getHttpServer();
      const statuses: number[] = [];
      for (let i = 0; i < 6; i++) {
        const res = await request(http).post('/api/public/booking/appointments/NOPE1234/confirm');
        statuses.push(res.status);
      }

      const firstBlocked = statuses.indexOf(429);
      expect(firstBlocked).toBeGreaterThanOrEqual(0);
      expect(statuses.slice(0, firstBlocked).every((s) => s === 404)).toBe(true);
      expect(statuses.slice(firstBlocked).every((s) => s === 429)).toBe(true);
    });
  });

  describe('GET /api/public/booking/barbers/:barberId/availability', () => {
    it('lists the 10:00 slot while free and hides it once booked', async () => {
      const date = mondayAt10().slice(0, 10);
      const startTimes = async () => {
        const res = await request(app.getHttpServer())
          .get(`/api/public/booking/barbers/${barberId}/availability`)
          .query({ date, serviceId })
          .expect(200);
        return (res.body.slots as Array<{ startTime: string }>).map((s) => s.startTime);
      };

      const before = await startTimes();
      expect(before).toContain('10:00');

      await createAppointment(); // 10:00–10:30 local time

      const after = await startTimes();
      expect(after).not.toContain('10:00');
      expect(after.length).toBeLessThan(before.length);
    });
  });

  describe('GET /api/appointments', () => {
    it('lists appointments filtered by establishment with pagination meta', async () => {
      await createAppointment();

      const res = await request(app.getHttpServer())
        .get('/api/appointments')
        .query({ establishmentId })
        .set(auth())
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.meta).toBeDefined();
      expect(res.body.totalRevenue).toBe(35);
    });

    it('lists appointments filtered by barber', async () => {
      await createAppointment();

      const res = await request(app.getHttpServer())
        .get('/api/appointments')
        .query({ barberId })
        .set(auth())
        .expect(200);

      expect(res.body.data).toHaveLength(1);
    });

    it('gets one appointment by id', async () => {
      const created = await createAppointment();

      const res = await request(app.getHttpServer())
        .get(`/api/appointments/${created.body.id}`)
        .set(auth())
        .expect(200);

      expect(res.body.id).toBe(created.body.id);
    });
  });

  describe('PATCH /api/appointments/:id/status', () => {
    const patchStatus = (id: string, status: string) =>
      request(app.getHttpServer())
        .patch(`/api/appointments/${id}/status`)
        .set(auth())
        .send({ status });

    it('follows the state machine SCHEDULED → IN_PROGRESS → DONE', async () => {
      const created = await createAppointment();

      await patchStatus(created.body.id, 'IN_PROGRESS').expect(200);
      const res = await patchStatus(created.body.id, 'DONE').expect(200);

      expect(res.body.status).toBe('DONE');
    });

    it('rejects skipping straight from SCHEDULED to DONE', async () => {
      const created = await createAppointment();

      await patchStatus(created.body.id, 'DONE').expect(400);
    });

    it('cancels a scheduled appointment', async () => {
      const created = await createAppointment();

      const res = await patchStatus(created.body.id, 'CANCELED').expect(200);

      expect(res.body.status).toBe('CANCELED');
    });
  });
});
