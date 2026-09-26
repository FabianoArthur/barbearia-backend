import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { encrypt, encryptDeterministic } from '../../../../common/utils/encryption.util';
import { isValidCpf, normalizeCpf } from '../../../../common/validators/cpf.validator';
import {
  CLIENT_REPOSITORY,
  type IClientRepository,
} from '../../domain/interfaces/client-repository.interface';
import type { CreateClientDto } from '../../presentation/dtos/create-client.dto';

@Injectable()
export class ClientService {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: IClientRepository,
  ) {}

  async findAll() {
    return this.clientRepository.findAll();
  }

  async findById(id: string) {
    const client = await this.clientRepository.findById(id);
    if (!client) {
      throw new NotFoundException('Client not found');
    }
    return client;
  }

  async findAllByEstablishment(establishmentId: string) {
    return this.clientRepository.findAllByEstablishment(establishmentId);
  }

  async create(dto: CreateClientDto) {
    const cpf = normalizeCpf(dto.cpf);

    if (!isValidCpf(cpf)) {
      throw new BadRequestException('Invalid CPF');
    }

    return this.clientRepository.create({
      establishmentId: dto.establishmentId,
      name: dto.name,
      cpf: encryptDeterministic(cpf),
      phone: dto.phone ? encrypt(dto.phone) : undefined,
    });
  }

  async findOrCreate(establishmentId: string, name: string, rawCpf: string, phone?: string) {
    const cpf = normalizeCpf(rawCpf);

    if (!isValidCpf(cpf)) {
      throw new BadRequestException('Invalid CPF');
    }

    const encryptedCpf = encryptDeterministic(cpf);

    const existing = await this.clientRepository.findByCpfAndEstablishment(
      encryptedCpf,
      establishmentId,
    );
    if (existing) {
      return existing;
    }

    return this.clientRepository.create({
      establishmentId,
      name,
      cpf: encryptedCpf,
      phone: phone ? encrypt(phone) : undefined,
    });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.clientRepository.delete(id);
  }
}
