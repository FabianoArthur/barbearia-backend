import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule as NestScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuditLogListener } from './common/events/audit-log.listener';
import { CsrfGuard } from './common/guards/csrf.guard';
import { getThrottleConfig } from './config/env';
import { CacheModule } from './infrastructure/cache/cache.module';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { AppointmentModule } from './modules/appointment/appointment.module';
import { AuthModule } from './modules/auth/auth.module';
import { BarberModule } from './modules/barber/barber.module';
import { ClientModule } from './modules/client/client.module';
import { EstablishmentModule } from './modules/establishment/establishment.module';
import { FinanceModule } from './modules/finance/finance.module';
import { NotificationModule } from './modules/notification/notification.module';
import { PaymentModule } from './modules/payment/payment.module';
import { PublicBookingModule } from './modules/public-booking/public-booking.module';
import { ScheduleModule } from './modules/schedule/schedule.module';
import { ServiceModule } from './modules/service/service.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    PrismaModule,
    CacheModule,
    EventEmitterModule.forRoot(),
    NestScheduleModule.forRoot(),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: Number(process.env.REDIS_PORT ?? 6379),
        maxRetriesPerRequest: null,
      },
    }),
    ThrottlerModule.forRoot({
      throttlers: [getThrottleConfig()],
    }),
    AuthModule,
    UserModule,
    EstablishmentModule,
    BarberModule,
    ClientModule,
    ServiceModule,
    ScheduleModule,
    AppointmentModule,
    FinanceModule,
    PaymentModule,
    PublicBookingModule,
    NotificationModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: CsrfGuard,
    },
    AuditLogListener,
  ],
})
export class AppModule {}
