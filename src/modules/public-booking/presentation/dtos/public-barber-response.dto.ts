import { ApiProperty } from '@nestjs/swagger';
import type { BarberWithUser } from '../../../barber/domain/interfaces/barber-repository.interface';

class PublicBarberUserDto {
  @ApiProperty()
  readonly id: string;

  @ApiProperty()
  readonly name: string;

  constructor(data: { id: string; name: string }) {
    this.id = data.id;
    this.name = data.name;
  }
}

export class PublicBarberResponseDto {
  @ApiProperty()
  readonly id: string;

  @ApiProperty()
  readonly establishmentId: string;

  @ApiProperty({ type: PublicBarberUserDto })
  readonly user: PublicBarberUserDto;

  private constructor(data: {
    id: string;
    establishmentId: string;
    user: PublicBarberUserDto;
  }) {
    this.id = data.id;
    this.establishmentId = data.establishmentId;
    this.user = data.user;
  }

  static fromEntity(entity: BarberWithUser): PublicBarberResponseDto {
    return new PublicBarberResponseDto({
      id: entity.id,
      establishmentId: entity.establishmentId,
      user: new PublicBarberUserDto({
        id: entity.user.id,
        name: entity.user.name,
      }),
    });
  }

  static fromEntities(entities: BarberWithUser[]): PublicBarberResponseDto[] {
    return entities.map(PublicBarberResponseDto.fromEntity);
  }
}
