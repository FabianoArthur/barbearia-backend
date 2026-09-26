import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  type IUserRepository,
  USER_REPOSITORY,
} from '../../domain/interfaces/user-repository.interface';
import type { UpdateUserDto } from '../../presentation/dtos/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async findById(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findAllByEstablishment(establishmentId: string) {
    return this.userRepository.findAllByEstablishment(establishmentId);
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findById(id);
    return this.userRepository.update(id, dto);
  }

  async delete(id: string) {
    await this.findById(id);
    return this.userRepository.delete(id);
  }
}
