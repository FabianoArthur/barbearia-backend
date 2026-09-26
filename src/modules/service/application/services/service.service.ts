import { Inject, Injectable } from '@nestjs/common';
import { DomainError, DomainErrorCode } from '../../../../common/errors';
import {
  type IServiceRepository,
  SERVICE_REPOSITORY,
} from '../../domain/interfaces/service-repository.interface';
import type { CreateServiceDto } from '../../presentation/dtos/create-service.dto';
import type { UpdateServiceDto } from '../../presentation/dtos/update-service.dto';

@Injectable()
export class ServiceService {
  constructor(
    @Inject(SERVICE_REPOSITORY)
    private readonly serviceRepository: IServiceRepository,
  ) {}

  async findAll() {
    return this.serviceRepository.findAll();
  }

  async findById(id: string) {
    const service = await this.serviceRepository.findById(id);
    if (!service) {
      throw DomainError.notFound(DomainErrorCode.SERVICE_NOT_FOUND, 'Service not found');
    }
    return service;
  }

  async findAllByEstablishment(establishmentId: string) {
    return this.serviceRepository.findAllByEstablishment(establishmentId);
  }

  async findAvailableByEstablishment(establishmentId: string) {
    return this.serviceRepository.findAvailableByEstablishment(establishmentId);
  }

  async findAllByBarber(barberId: string) {
    return this.serviceRepository.findAllByBarber(barberId);
  }

  async create(dto: CreateServiceDto) {
    return this.serviceRepository.create(dto);
  }

  async update(id: string, dto: UpdateServiceDto) {
    await this.findById(id);
    return this.serviceRepository.update(id, dto);
  }

  async delete(id: string) {
    await this.findById(id);
    return this.serviceRepository.delete(id);
  }
}
