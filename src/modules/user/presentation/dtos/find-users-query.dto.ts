import { ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

const SORTABLE_FIELDS = ['name', 'role', 'createdAt'] as const;
const SORT_ORDERS = ['asc', 'desc'] as const;

export type UserSortField = (typeof SORTABLE_FIELDS)[number];
export type UserSortOrder = (typeof SORT_ORDERS)[number];

export class FindUsersQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly page: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20, example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  readonly pageSize: number = 20;

  @ApiPropertyOptional({ enum: Role, description: 'Filter by role' })
  @IsOptional()
  @IsEnum(Role)
  readonly role?: Role;

  @ApiPropertyOptional({ description: 'Search by name (case-insensitive)' })
  @IsOptional()
  @IsString()
  readonly search?: string;

  @ApiPropertyOptional({
    enum: SORTABLE_FIELDS,
    default: 'createdAt',
    example: 'createdAt',
  })
  @IsOptional()
  @IsIn(SORTABLE_FIELDS)
  readonly sortBy: UserSortField = 'createdAt';

  @ApiPropertyOptional({
    enum: SORT_ORDERS,
    default: 'desc',
    example: 'desc',
  })
  @IsOptional()
  @IsIn(SORT_ORDERS)
  readonly sortOrder: UserSortOrder = 'desc';

  @ApiPropertyOptional({ description: 'Filter by establishment ID' })
  @IsOptional()
  @IsString()
  readonly establishmentId?: string;
}
