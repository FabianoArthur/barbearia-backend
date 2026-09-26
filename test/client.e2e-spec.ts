import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  accessTokenOf,
  asTestUser,
  cleanDatabase,
  createTestApp,
  TEST_CPFS,
  type TestUser,
} from './setup';

describe('Client (e2e)', () => {
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

  describe('POST /api/clients', () => {
    it('should create a client with valid CPF', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/clients')
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .send({ establishmentId, name: 'John Doe', cpf: TEST_CPFS.valid1 })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.name).toBe('John Doe');
      expect(res.body.cpf).toBe('123.***.***-**');
    });

    it('should create a client with phone', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/clients')
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .send({
          establishmentId,
          name: 'Jane Doe',
          cpf: TEST_CPFS.valid2,
          phone: '11999999999',
        })
        .expect(201);

      expect(res.body.phone).toBe('*******9999');
    });

    it('should reject invalid CPF', async () => {
      await request(app.getHttpServer())
        .post('/api/clients')
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .send({ establishmentId, name: 'Bad CPF', cpf: TEST_CPFS.invalid })
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
        .post('/api/clients')
        .set('Authorization', `Bearer ${accessTokenOf(barberRes)}`)
        .send({ establishmentId, name: 'Client', cpf: TEST_CPFS.valid1 })
        .expect(403);
    });
  });

  describe('GET /api/clients/establishment/:establishmentId', () => {
    it('should list clients by establishment', async () => {
      await request(app.getHttpServer())
        .post('/api/clients')
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .send({ establishmentId, name: 'Client 1', cpf: TEST_CPFS.valid1 });

      const res = await request(app.getHttpServer())
        .get(`/api/clients/establishment/${establishmentId}`)
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe('Client 1');
    });
  });

  describe('GET /api/clients/:id', () => {
    it('should get client by id', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/clients')
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .send({ establishmentId, name: 'Client', cpf: TEST_CPFS.valid1 });

      const res = await request(app.getHttpServer())
        .get(`/api/clients/${created.body.id}`)
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .expect(200);

      expect(res.body.id).toBe(created.body.id);
    });
  });

  describe('DELETE /api/clients/:id', () => {
    it('should delete a client', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/clients')
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .send({ establishmentId, name: 'To Delete', cpf: TEST_CPFS.valid1 });

      await request(app.getHttpServer())
        .delete(`/api/clients/${created.body.id}`)
        .set('Authorization', `Bearer ${superAdmin.accessToken}`)
        .expect(200);
    });
  });
});
