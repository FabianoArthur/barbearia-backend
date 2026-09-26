import { Inject, Injectable } from '@nestjs/common';
import {
  BARBER_REPOSITORY,
  type IBarberRepository,
} from '../../../barber/domain/interfaces/barber-repository.interface';
import {
  APPOINTMENT_REPOSITORY,
  type IAppointmentRepository,
} from '../../domain/interfaces/appointment-repository.interface';
import type { FindAppointmentsQueryDto } from '../../presentation/dtos/find-appointments-query.dto';

@Injectable()
export class FindAppointmentsQueryHandler {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepository: IAppointmentRepository,
    @Inject(BARBER_REPOSITORY)
    private readonly barberRepository: IBarberRepository,
  ) {}

  async execute(query: FindAppointmentsQueryDto) {
    const {
      page,
      limit,
      skip,
      establishmentId,
      barberId,
      startDate,
      endDate,
      status,
      sortBy,
      sortOrder,
    } = query;

    const resolvedBarberId = barberId ? await this.resolveBarberIdFromUserId(barberId) : undefined;

    const result = await this.appointmentRepository.findAllPaginatedLean({
      skip,
      limit,
      establishmentId,
      barberId: resolvedBarberId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      status,
      sortBy,
      sortOrder,
    });

    return { ...result, page, limit };
  }

  /**
   * The frontend sends the User ID (from the JWT `sub` claim) as `barberId`.
   * Appointments store the Barber entity ID, not the User ID.
   * This resolves a userId to the actual Barber.id when needed.
   */
  private async resolveBarberIdFromUserId(idOrUserId: string): Promise<string> {
    const barber = await this.barberRepository.findByUserId(idOrUserId);
    if (barber) {
      return barber.id;
    }
    // Already a Barber.id — use as-is
    return idOrUserId;
  }
}
