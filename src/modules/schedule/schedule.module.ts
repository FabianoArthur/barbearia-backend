import { Module } from '@nestjs/common';
import { ScheduleService } from './application/services/schedule.service';
import {
  SCHEDULE_OVERRIDE_REPOSITORY,
  TIME_OFF_REPOSITORY,
  WORKING_HOUR_REPOSITORY,
} from './domain/interfaces/schedule-repository.interface';
import { PrismaScheduleOverrideRepository } from './infrastructure/repositories/prisma-schedule-override.repository';
import { PrismaTimeOffRepository } from './infrastructure/repositories/prisma-time-off.repository';
import { PrismaWorkingHourRepository } from './infrastructure/repositories/prisma-working-hour.repository';
import { ScheduleController } from './presentation/controllers/schedule.controller';

@Module({
  controllers: [ScheduleController],
  providers: [
    ScheduleService,
    {
      provide: WORKING_HOUR_REPOSITORY,
      useClass: PrismaWorkingHourRepository,
    },
    {
      provide: TIME_OFF_REPOSITORY,
      useClass: PrismaTimeOffRepository,
    },
    {
      provide: SCHEDULE_OVERRIDE_REPOSITORY,
      useClass: PrismaScheduleOverrideRepository,
    },
  ],
  exports: [ScheduleService],
})
export class ScheduleModule {}
