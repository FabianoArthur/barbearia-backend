import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class UserListItemDto {
  @ApiProperty({ example: 'clx1234567890' })
  readonly id!: string;

  @ApiProperty({ example: 'João Silva' })
  readonly name!: string;

  @ApiProperty({ example: 'joao@example.com' })
  readonly email!: string;

  @ApiProperty({ enum: Role })
  readonly role!: Role;

  @ApiProperty({ nullable: true, example: 'clx0987654321' })
  readonly establishmentId!: string | null;

  @ApiProperty({ example: '2026-02-16T12:00:00.000Z' })
  readonly createdAt!: Date;
}
