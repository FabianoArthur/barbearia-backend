import { Injectable } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import type { FindUsersQueryDto } from '../../presentation/dtos/find-users-query.dto';

@Injectable()
export class FindUsersQueryHandler {
  constructor(private readonly prisma: PrismaService) {}

  async execute(params: FindUsersQueryDto) {
    const {
      page = 1,
      pageSize = 20,
      role,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      establishmentId,
    } = params;

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
    };

    if (role) {
      where.role = role as Role;
    }

    if (establishmentId) {
      where.establishmentId = establishmentId;
    }

    if (search?.trim()) {
      where.name = { contains: search.trim(), mode: 'insensitive' };
    }

    const skip = (page - 1) * pageSize;
    const orderBy = { [sortBy]: sortOrder } as const;

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          establishmentId: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return { data, total, page, pageSize, totalPages };
  }
}
