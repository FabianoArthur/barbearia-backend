import { ApiProperty } from '@nestjs/swagger';
import type { Service } from '@prisma/client';

export class PublicServiceResponseDto {
  @ApiProperty()
  readonly id: string;

  @ApiProperty()
  readonly establishmentId: string;

  @ApiProperty()
  readonly name: string;

  @ApiProperty()
  readonly price: number;

  @ApiProperty()
  readonly durationMinutes: number;

  private constructor(
    data: Pick<Service, 'id' | 'establishmentId' | 'name' | 'price' | 'durationMinutes'>,
  ) {
    this.id = data.id;
    this.establishmentId = data.establishmentId;
    this.name = data.name;
    this.price = data.price;
    this.durationMinutes = data.durationMinutes;
  }

  static fromEntity(entity: Service): PublicServiceResponseDto {
    return new PublicServiceResponseDto(entity);
  }

  static fromEntities(entities: Service[]): PublicServiceResponseDto[] {
    return entities.map(PublicServiceResponseDto.fromEntity);
  }
}
