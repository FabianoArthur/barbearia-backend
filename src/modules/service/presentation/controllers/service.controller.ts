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
import { ServiceService } from '../../application/services/service.service';
import { CreateServiceDto } from '../dtos/create-service.dto';
import { UpdateServiceDto } from '../dtos/update-service.dto';

@ApiTags('Services')
@ApiBearerAuth()
@ApiSecurity('csrf-token')
@Controller('services')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Get()
  @ApiOperation({ summary: 'List all services' })
  @ApiResponse({ status: 200, description: 'Returns list of services' })
  findAll() {
    return this.serviceService.findAll();
  }

  @Get('establishment/:establishmentId')
  @ApiOperation({ summary: 'List services by establishment' })
  @ApiParam({ name: 'establishmentId', description: 'Establishment ID' })
  @ApiResponse({ status: 200, description: 'Returns list of services for the establishment' })
  findAllByEstablishment(@Param('establishmentId') establishmentId: string) {
    return this.serviceService.findAllByEstablishment(establishmentId);
  }

  @Get('barber/:barberId')
  @ApiOperation({ summary: 'List services by barber' })
  @ApiParam({ name: 'barberId', description: 'Barber ID' })
  @ApiResponse({ status: 200, description: 'Returns list of services for the barber' })
  findAllByBarber(@Param('barberId') barberId: string) {
    return this.serviceService.findAllByBarber(barberId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service by ID' })
  @ApiParam({ name: 'id', description: 'Service ID' })
  @ApiResponse({ status: 200, description: 'Returns the service' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  findById(@Param('id') id: string) {
    return this.serviceService.findById(id);
  }

  @Post()
  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new service' })
  @ApiResponse({ status: 201, description: 'Service created' })
  create(@Body() dto: CreateServiceDto) {
    return this.serviceService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a service' })
  @ApiParam({ name: 'id', description: 'Service ID' })
  @ApiResponse({ status: 200, description: 'Service updated' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  update(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.serviceService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a service' })
  @ApiParam({ name: 'id', description: 'Service ID' })
  @ApiResponse({ status: 200, description: 'Service deleted' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  delete(@Param('id') id: string) {
    return this.serviceService.delete(id);
  }
}
