import { Inject, Injectable } from '@nestjs/common';
import { DomainError, DomainErrorCode } from '../../../../common/errors';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { ACTIVE_STATUSES } from '../../../appointment/domain/appointment-status-machine';
import {
  ESTABLISHMENT_REPOSITORY,
  type IEstablishmentRepository,
} from '../../domain/interfaces/establishment-repository.interface';
import type { CreateEstablishmentDto } from '../../presentation/dtos/create-establishment.dto';
import type { UpdateEstablishmentDto } from '../../presentation/dtos/update-establishment.dto';

@Injectable()
export class EstablishmentService {
  constructor(
    @Inject(ESTABLISHMENT_REPOSITORY)
    private readonly establishmentRepository: IEstablishmentRepository,
    private readonly prisma: PrismaService,
  ) {}

  async findAll() {
    return this.establishmentRepository.findAll();
  }

  async findById(id: string) {
    const establishment = await this.establishmentRepository.findById(id);
    if (!establishment) {
      throw DomainError.notFound(
        DomainErrorCode.ESTABLISHMENT_NOT_FOUND,
        'Establishment not found',
      );
    }
    return establishment;
  }

  async create(dto: CreateEstablishmentDto) {
    const existing = await this.establishmentRepository.findByName(dto.name);
    if (existing) {
      throw DomainError.conflict(
        DomainErrorCode.VALIDATION_ERROR,
        'Establishment with this name already exists',
      );
    }
    return this.establishmentRepository.create(dto);
  }

  async update(id: string, dto: UpdateEstablishmentDto) {
    await this.findById(id);
    return this.establishmentRepository.update(id, dto);
  }

  async delete(id: string) {
    await this.findById(id);

    const futureBookings = await this.prisma.appointment.count({
      where: {
        establishmentId: id,
        deletedAt: null,
        status: { in: [...ACTIVE_STATUSES] },
        startsAt: { gte: new Date() },
      },
    });

    if (futureBookings > 0) {
      throw DomainError.conflict(
        DomainErrorCode.ESTABLISHMENT_HAS_BOOKINGS,
        'Cannot delete establishment with active bookings',
        { bookingCount: futureBookings },
      );
    }

    return this.establishmentRepository.delete(id);
  }
}
