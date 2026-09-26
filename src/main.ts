import './load-env';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';
import { validateEnv } from './config/env';

async function bootstrap() {
  validateEnv();

  const app = await NestFactory.create(AppModule);
  configureApp(app);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Barbearia API')
    .setDescription(
      [
        'Multi-establishment barbershop management API.',
        '',
        '## CSRF Protection',
        'State-changing requests (POST / PUT / PATCH / DELETE) that rely on **cookie-based** auth',
        'require a CSRF token. The flow:',
        '1. Call `POST /auth/login` (or `/auth/register` / `/auth/refresh`) — the response sets a `csrf_token` cookie.',
        '   Alternatively call `GET /auth/csrf-token` to obtain one at any time.',
        '2. Read the `csrf_token` cookie value (it is **not** httpOnly).',
        '3. Send it back on every mutating request as the `x-csrf-token` header.',
        '',
        'Requests using a **Bearer** token in the `Authorization` header are exempt from CSRF.',
      ].join('\n'),
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addCookieAuth('access_token')
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-csrf-token',
        in: 'header',
        description:
          'CSRF token. Read the csrf_token cookie (set on login/register/refresh) and send it here.',
      },
      'csrf-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}

bootstrap();
