import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Client } from '@prisma/client';
import { maskCpf } from '../../../../common/utils/cpf-mask.util';
import { safeDecrypt } from '../../../../common/utils/encryption.util';
import { maskPhone } from '../../../../common/utils/phone-mask.util';

export class ClientResponseDto {
  @ApiProperty()
  readonly id!: string;

  @ApiProperty()
  readonly establishmentId!: string;

  @ApiProperty()
  readonly name!: string;

  @ApiProperty({ example: '123.***.***-**', description: 'Masked CPF (first 3 digits only)' })
  readonly cpf!: string;

  @ApiPropertyOptional({
    example: '*******8888',
    description: 'Masked phone (last 4 digits only)',
  })
  readonly phone!: string | null;

  @ApiProperty()
  readonly createdAt!: Date;

  @ApiProperty()
  readonly updatedAt!: Date;

  static fromEntity(client: Client): ClientResponseDto {
    return {
      id: client.id,
      establishmentId: client.establishmentId,
      name: client.name,
      cpf: maskCpf(safeDecrypt(client.cpf)),
      phone: client.phone ? maskPhone(safeDecrypt(client.phone)) : null,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
    };
  }
}
