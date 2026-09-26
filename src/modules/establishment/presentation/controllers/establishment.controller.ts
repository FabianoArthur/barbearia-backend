import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../../../common/decorators';
import { RolesGuard } from '../../../../common/guards';
import { EstablishmentService } from '../../application/services/establishment.service';
import { CreateEstablishmentDto } from '../dtos/create-establishment.dto';
import { UpdateEstablishmentDto } from '../dtos/update-establishment.dto';

@ApiTags('Establishments')
@ApiBearerAuth()
@ApiSecurity('csrf-token')
@Controller('establishments')
export class EstablishmentController {
  constructor(private readonly establishmentService: EstablishmentService) {}

  @Get()
  @ApiOperation({ summary: 'List all establishments' })
  @ApiResponse({ status: 200, description: 'Returns list of establishments' })
  findAll() {
    return this.establishmentService.findAll();
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Get establishment by ID' })
  @ApiParam({ name: 'id', description: 'Establishment ID' })
  @ApiResponse({ status: 200, description: 'Returns the establishment' })
  @ApiResponse({ status: 404, description: 'Establishment not found' })
  findById(@Param('id') id: string) {
    return this.establishmentService.findById(id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Post()
  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new establishment' })
  @ApiResponse({ status: 201, description: 'Establishment created' })
  create(@Body() dto: CreateEstablishmentDto) {
    return this.establishmentService.create(dto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Patch(':id')
  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update an establishment' })
  @ApiParam({ name: 'id', description: 'Establishment ID' })
  @ApiResponse({ status: 200, description: 'Establishment updated' })
  @ApiResponse({ status: 404, description: 'Establishment not found' })
  update(@Param('id') id: string, @Body() dto: UpdateEstablishmentDto) {
    return this.establishmentService.update(id, dto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete an establishment' })
  @ApiParam({ name: 'id', description: 'Establishment ID' })
  @ApiResponse({ status: 200, description: 'Establishment deleted' })
  @ApiResponse({ status: 404, description: 'Establishment not found' })
  delete(@Param('id') id: string) {
    return this.establishmentService.delete(id);
  }
}
