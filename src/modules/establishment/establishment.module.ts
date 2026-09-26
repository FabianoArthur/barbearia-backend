import { Module } from '@nestjs/common';
import { EstablishmentService } from './application/services/establishment.service';
import { ESTABLISHMENT_REPOSITORY } from './domain/interfaces/establishment-repository.interface';
import { PrismaEstablishmentRepository } from './infrastructure/repositories/prisma-establishment.repository';
import { EstablishmentController } from './presentation/controllers/establishment.controller';

@Module({
  controllers: [EstablishmentController],
  providers: [
    EstablishmentService,
    {
      provide: ESTABLISHMENT_REPOSITORY,
      useClass: PrismaEstablishmentRepository,
    },
  ],
  exports: [EstablishmentService],
})
export class EstablishmentModule {}
