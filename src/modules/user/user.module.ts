import { Module } from '@nestjs/common';
import { FindUsersQueryHandler } from './application/queries/find-users.query-handler';
import { UserService } from './application/services/user.service';
import { USER_REPOSITORY } from './domain/interfaces/user-repository.interface';
import { PrismaUserRepository } from './infrastructure/repositories/prisma-user.repository';
import { UserController } from './presentation/controllers/user.controller';

@Module({
  controllers: [UserController],
  providers: [
    UserService,
    FindUsersQueryHandler,
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
  ],
  exports: [UserService],
})
export class UserModule {}
