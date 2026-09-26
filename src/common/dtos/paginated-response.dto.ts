import { ApiProperty } from '@nestjs/swagger';

export class PaginationMeta {
  @ApiProperty({ example: 150, description: 'Total number of items' })
  readonly totalItems: number;

  @ApiProperty({ example: 20, description: 'Number of items per page' })
  readonly itemsPerPage: number;

  @ApiProperty({ example: 1, description: 'Current page number' })
  readonly currentPage: number;

  @ApiProperty({ example: 8, description: 'Total number of pages' })
  readonly totalPages: number;

  constructor(totalItems: number, itemsPerPage: number, currentPage: number) {
    this.totalItems = totalItems;
    this.itemsPerPage = itemsPerPage;
    this.currentPage = currentPage;
    this.totalPages = Math.ceil(totalItems / itemsPerPage);
  }
}

export class PaginatedResponseDto<T> {
  @ApiProperty({ isArray: true, description: 'Array of items' })
  readonly data: T[];

  @ApiProperty({ type: PaginationMeta })
  readonly meta: PaginationMeta;

  constructor(data: T[], totalItems: number, page: number, limit: number) {
    this.data = data;
    this.meta = new PaginationMeta(totalItems, limit, page);
  }
}
