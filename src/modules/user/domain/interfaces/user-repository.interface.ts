import type { User } from '@prisma/client';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAllByEstablishment(establishmentId: string): Promise<User[]>;
  update(id: string, data: Partial<Pick<User, 'name' | 'email' | 'role'>>): Promise<User>;
  delete(id: string): Promise<void>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
