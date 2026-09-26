import { type Provider } from '@nestjs/common';
import Redis from 'ioredis';

export const REMINDER_REDIS = Symbol('REMINDER_REDIS');

export const ReminderRedisProvider: Provider = {
  provide: REMINDER_REDIS,
  useFactory: (): Redis => {
    return new Redis({
      host: process.env.REDIS_HOST ?? 'localhost',
      port: Number(process.env.REDIS_PORT ?? 6379),
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });
  },
};
