import { Module } from '@nestjs/common';
import { BarberService } from './application/services/barber.service';
import { BARBER_REPOSITORY } from './domain/interfaces/barber-repository.interface';
import { PrismaBarberRepository } from './infrastructure/repositories/prisma-barber.repository';
import { BarberController } from './presentation/controllers/barber.controller';

@Module({
  controllers: [BarberController],
  providers: [
    BarberService,
    {
      provide: BARBER_REPOSITORY,
      useClass: PrismaBarberRepository,
    },
  ],
  exports: [BarberService, BARBER_REPOSITORY],
})
export class BarberModule {}
