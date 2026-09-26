import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  accessTokenOf,
  asTestUser,
  cleanDatabase,
  createTestApp,
  nextWeekdayAt,
  TEST_CPFS,
  type TestUser,
} from './setup';

describe('Finance (e2e)', () => {
  let app: INestApplication;
  let superAdmin: TestUser;
  let barberToken: string;
  let establishmentId: string;
  let barberId: string;
  let appointmentId: string;

  const auth = (token = superAdmin.accessToken) => ({ Authorization: `Bearer ${token}` });

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
    barberToken = accessTokenOf(barberUserRes);

    const barberRes = await request(http)
      .post('/api/barbers')
      .set(auth())
      .send({ userId: barberUserRes.body.user.id, establishmentId });
    barberId = barberRes.body.id;

    await request(http)
      .post('/api/schedule/working-hours')
      .set(auth())
      .send({ barberId, weekday: 1, startTime: '08:00', endTime: '18:00' });

    const clientRes = await request(http)
      .post('/api/clients')
      .set(auth())
      .send({ establishmentId, name: 'Client', cpf: TEST_CPFS.valid1 });

    const serviceRes = await request(http)
      .post('/api/services')
      .set(auth())
      .send({ establishmentId, name: 'Haircut', price: 50, durationMinutes: 30 });

    await request(http)
      .put(`/api/barbers/${barberId}/services`)
      .set(auth())
      .send({ serviceIds: [serviceRes.body.id] })
      .expect(200);

    const appointmentRes = await request(http)
      .post('/api/appointments')
      .set(auth())
      .send({
        establishmentId,
        barberId,
        clientId: clientRes.body.id,
        serviceId: serviceRes.body.id,
        startsAt: nextWeekdayAt(1, '13:00'),
      })
      .expect(201);
    appointmentId = appointmentRes.body.id;
  });

  async function finishAppointment() {
    const http = app.getHttpServer();
    await request(http).post(`/api/appointments/${appointmentId}/start`).set(auth()).expect(201);
    await request(http).post(`/api/appointments/${appointmentId}/finish`).set(auth()).expect(201);
  }

  describe('payments', () => {
    it('finishing an appointment creates a pending payment for the service price', async () => {
      await finishAppointment();

      const res = await request(app.getHttpServer())
        .get(`/api/payments/appointment/${appointmentId}`)
        .set(auth())
        .expect(200);

      const payment = Array.isArray(res.body) ? res.body[0] : res.body;
      expect(payment.status).toBe('PENDING');
      expect(Number(payment.amount)).toBe(50);
    });

    it('confirms a payment with method and tip', async () => {
      await finishAppointment();
      const pending = await request(app.getHttpServer())
        .get(`/api/payments/appointment/${appointmentId}`)
        .set(auth());
      const paymentId = (Array.isArray(pending.body) ? pending.body[0] : pending.body).id;

      const res = await request(app.getHttpServer())
        .patch(`/api/payments/${paymentId}/confirm`)
        .set(auth())
        .send({ method: 'PIX', tipAmount: 10 })
        .expect(200);

      expect(res.body.status).toBe('COMPLETED');
      expect(res.body.method).toBe('PIX');
    });
  });

  describe('expenses', () => {
    const expense = {
      category: 'SUPPLIES',
      description: 'Razor blades',
      amount: 120,
      date: '2026-01-15',
    };

    it('lets a SUPER_ADMIN record and list expenses', async () => {
      await request(app.getHttpServer())
        .post('/api/finance/expenses')
        .set(auth())
        .send({ ...expense, establishmentId })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get('/api/finance/expenses')
        .query({ establishmentId })
        .set(auth())
        .expect(200);

      const list = Array.isArray(res.body) ? res.body : res.body.data;
      expect(list).toHaveLength(1);
      expect(list[0].description).toBe('Razor blades');
    });

    it('forbids a BARBER from recording expenses', async () => {
      await request(app.getHttpServer())
        .post('/api/finance/expenses')
        .set(auth(barberToken))
        .send({ ...expense, establishmentId })
        .expect(403);
    });
  });

  describe('GET /api/finance/dashboard', () => {
    it('returns the KPI overview for an establishment', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/finance/dashboard')
        .query({ establishmentId, period: 'month' })
        .set(auth())
        .expect(200);

      expect(res.body).toEqual(
        expect.objectContaining({
          grossRevenue: expect.any(Number),
          netRevenue: expect.any(Number),
          totalBookings: expect.any(Number),
          today: expect.any(Object),
        }),
      );
    });

    it("forbids a MANAGER from reading another establishment's dashboard", async () => {
      const http = app.getHttpServer();
      const managerRes = await request(http).post('/api/auth/register').send({
        name: 'Manager A',
        email: 'manager.a@test.com',
        password: 'password123',
        role: 'MANAGER',
        establishmentId,
      });
      const otherShop = await request(http)
        .post('/api/establishments')
        .set(auth())
        .send({ name: 'Other Shop' });

      await request(http)
        .get('/api/finance/dashboard')
        .query({ establishmentId: otherShop.body.id })
        .set(auth(accessTokenOf(managerRes)))
        .expect(403);
      await request(http)
        .get('/api/finance/dashboard')
        .query({ establishmentId })
        .set(auth(accessTokenOf(managerRes)))
        .expect(200);
    });

    it('rejects an unknown period', async () => {
      await request(app.getHttpServer())
        .get('/api/finance/dashboard')
        .query({ establishmentId, period: 'decade' })
        .set(auth())
        .expect(400);
    });
  });
});
