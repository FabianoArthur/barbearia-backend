import { Module } from '@nestjs/common';
import { ServiceService } from './application/services/service.service';
import { SERVICE_REPOSITORY } from './domain/interfaces/service-repository.interface';
import { PrismaServiceRepository } from './infrastructure/repositories/prisma-service.repository';
import { ServiceController } from './presentation/controllers/service.controller';

@Module({
  controllers: [ServiceController],
  providers: [
    ServiceService,
    {
      provide: SERVICE_REPOSITORY,
      useClass: PrismaServiceRepository,
    },
  ],
  exports: [ServiceService],
})
export class ServiceModule {}
