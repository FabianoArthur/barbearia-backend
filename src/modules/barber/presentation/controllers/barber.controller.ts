import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../../../common/decorators';
import { RolesGuard } from '../../../../common/guards';
import { BarberService } from '../../application/services/barber.service';
import { CreateBarberDto } from '../dtos/create-barber.dto';
import { UpdateBarberDto } from '../dtos/update-barber.dto';

@ApiTags('Barbers')
@ApiBearerAuth()
@ApiSecurity('csrf-token')
@Controller('barbers')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class BarberController {
  constructor(private readonly barberService: BarberService) {}

  @Get()
  @ApiOperation({ summary: 'List all barbers' })
  @ApiResponse({ status: 200, description: 'Returns list of barbers' })
  findAll() {
    return this.barberService.findAll();
  }

  @Get('establishment/:establishmentId')
  @ApiOperation({ summary: 'List barbers by establishment' })
  @ApiParam({ name: 'establishmentId', description: 'Establishment ID' })
  @ApiResponse({ status: 200, description: 'Returns list of barbers' })
  findAllByEstablishment(@Param('establishmentId') establishmentId: string) {
    return this.barberService.findAllByEstablishment(establishmentId);
  }

  @Get('service/:serviceId')
  @ApiOperation({ summary: 'List barbers that offer a specific service' })
  @ApiParam({ name: 'serviceId', description: 'Service ID' })
  @ApiResponse({ status: 200, description: 'Returns list of barbers that offer the service' })
  findAllByService(@Param('serviceId') serviceId: string) {
    return this.barberService.findAllByService(serviceId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get barber by ID' })
  @ApiParam({ name: 'id', description: 'Barber ID' })
  @ApiResponse({ status: 200, description: 'Returns the barber' })
  @ApiResponse({ status: 404, description: 'Barber not found' })
  findById(@Param('id') id: string) {
    return this.barberService.findById(id);
  }

  @Post()
  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new barber profile' })
  @ApiResponse({ status: 201, description: 'Barber created' })
  create(@Body() dto: CreateBarberDto) {
    return this.barberService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a barber (name, email, commission, services)' })
  @ApiParam({ name: 'id', description: 'Barber ID' })
  @ApiResponse({ status: 200, description: 'Barber updated' })
  @ApiResponse({ status: 404, description: 'Barber not found' })
  update(@Param('id') id: string, @Body() dto: UpdateBarberDto) {
    return this.barberService.update(id, dto);
  }

  @Put(':id/services')
  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Replace the full set of services assigned to a barber' })
  @ApiParam({ name: 'id', description: 'Barber ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { serviceIds: { type: 'array', items: { type: 'string' } } },
    },
  })
  @ApiResponse({ status: 200, description: 'Services assigned' })
  @ApiResponse({ status: 404, description: 'Barber not found' })
  setServices(@Param('id') id: string, @Body('serviceIds') serviceIds: string[]) {
    return this.barberService.setServices(id, serviceIds);
  }

  @Delete(':id')
  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a barber' })
  @ApiParam({ name: 'id', description: 'Barber ID' })
  @ApiResponse({ status: 200, description: 'Barber deleted' })
  @ApiResponse({ status: 404, description: 'Barber not found' })
  delete(@Param('id') id: string) {
    return this.barberService.delete(id);
  }
}
