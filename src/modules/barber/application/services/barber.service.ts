import { Inject, Injectable } from '@nestjs/common';
import { DomainError, DomainErrorCode } from '../../../../common/errors';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { ACTIVE_STATUSES } from '../../../appointment/domain/appointment-status-machine';
import {
  BARBER_REPOSITORY,
  type IBarberRepository,
} from '../../domain/interfaces/barber-repository.interface';
import type { CreateBarberDto } from '../../presentation/dtos/create-barber.dto';
import type { UpdateBarberDto } from '../../presentation/dtos/update-barber.dto';

@Injectable()
export class BarberService {
  constructor(
    @Inject(BARBER_REPOSITORY)
    private readonly barberRepository: IBarberRepository,
    private readonly prisma: PrismaService,
  ) {}

  async findAll() {
    return this.barberRepository.findAll();
  }

  async findById(id: string) {
    const barber = await this.barberRepository.findById(id);
    if (!barber) {
      throw DomainError.notFound(DomainErrorCode.BARBER_NOT_FOUND, 'Barber not found');
    }
    return barber;
  }

  async findByIdWithEstablishment(id: string) {
    const barber = await this.barberRepository.findByIdWithEstablishment(id);
    if (!barber) {
      throw DomainError.notFound(DomainErrorCode.BARBER_NOT_FOUND, 'Barber not found');
    }
    return barber;
  }

  async findByUserId(userId: string) {
    const barber = await this.barberRepository.findByUserId(userId);
    if (!barber) {
      throw DomainError.notFound(DomainErrorCode.BARBER_NOT_FOUND, 'Barber not found');
    }
    return barber;
  }

  async findAllByEstablishment(establishmentId: string) {
    return this.barberRepository.findAllByEstablishment(establishmentId);
  }

  async findAllByService(serviceId: string) {
    return this.barberRepository.findAllByService(serviceId);
  }

  async create(dto: CreateBarberDto) {
    return this.barberRepository.create(dto);
  }

  async update(id: string, dto: UpdateBarberDto) {
    await this.findById(id);
    return this.barberRepository.update(id, dto);
  }

  async setServices(barberId: string, serviceIds: string[]) {
    await this.findById(barberId);
    return this.barberRepository.setServices(barberId, serviceIds);
  }

  async delete(id: string) {
    await this.findById(id);

    const futureBookings = await this.prisma.appointment.count({
      where: {
        barberId: id,
        deletedAt: null,
        status: { in: [...ACTIVE_STATUSES] },
        startsAt: { gte: new Date() },
      },
    });

    if (futureBookings > 0) {
      throw DomainError.conflict(
        DomainErrorCode.BARBER_HAS_BOOKINGS,
        'Cannot delete barber with active bookings',
        { bookingCount: futureBookings },
      );
    }

    return this.barberRepository.delete(id);
  }
}
