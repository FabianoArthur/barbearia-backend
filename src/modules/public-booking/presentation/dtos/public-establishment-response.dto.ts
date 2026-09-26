import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Establishment } from '@prisma/client';

export class PublicEstablishmentResponseDto {
  @ApiProperty()
  readonly id: string;

  @ApiProperty()
  readonly name: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  readonly address: string | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  readonly lat: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  readonly lng: number | null;

  private constructor(data: Pick<Establishment, 'id' | 'name' | 'address' | 'lat' | 'lng'>) {
    this.id = data.id;
    this.name = data.name;
    this.address = data.address;
    this.lat = data.lat;
    this.lng = data.lng;
  }

  static fromEntity(entity: Establishment): PublicEstablishmentResponseDto {
    return new PublicEstablishmentResponseDto(entity);
  }

  static fromEntities(entities: Establishment[]): PublicEstablishmentResponseDto[] {
    return entities.map(PublicEstablishmentResponseDto.fromEntity);
  }
}
