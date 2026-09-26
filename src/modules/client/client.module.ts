import { Module } from '@nestjs/common';
import { ClientService } from './application/services/client.service';
import { CLIENT_REPOSITORY } from './domain/interfaces/client-repository.interface';
import { PrismaClientRepository } from './infrastructure/repositories/prisma-client.repository';
import { ClientController } from './presentation/controllers/client.controller';

@Module({
  controllers: [ClientController],
  providers: [
    ClientService,
    {
      provide: CLIENT_REPOSITORY,
      useClass: PrismaClientRepository,
    },
  ],
  exports: [ClientService],
})
export class ClientModule {}
