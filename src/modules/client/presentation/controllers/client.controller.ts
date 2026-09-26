import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
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
import { ClientService } from '../../application/services/client.service';
import { ClientResponseDto } from '../dtos/client-response.dto';
import { CreateClientDto } from '../dtos/create-client.dto';

@ApiTags('Clients')
@ApiBearerAuth()
@ApiSecurity('csrf-token')
@Controller('clients')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all clients' })
  @ApiResponse({
    status: 200,
    description: 'Returns list of all clients',
    type: [ClientResponseDto],
  })
  async findAll(): Promise<ClientResponseDto[]> {
    const clients = await this.clientService.findAll();
    return clients.map(ClientResponseDto.fromEntity);
  }

  @Get('establishment/:establishmentId')
  @Roles(Role.MANAGER, Role.SUPER_ADMIN, Role.BARBER)
  @ApiOperation({ summary: 'List clients by establishment' })
  @ApiParam({ name: 'establishmentId', description: 'Establishment ID' })
  @ApiResponse({ status: 200, description: 'Returns list of clients', type: [ClientResponseDto] })
  async findAllByEstablishment(
    @Param('establishmentId') establishmentId: string,
  ): Promise<ClientResponseDto[]> {
    const clients = await this.clientService.findAllByEstablishment(establishmentId);
    return clients.map(ClientResponseDto.fromEntity);
  }

  @Get(':id')
  @Roles(Role.MANAGER, Role.SUPER_ADMIN, Role.BARBER)
  @ApiOperation({ summary: 'Get client by ID' })
  @ApiParam({ name: 'id', description: 'Client ID' })
  @ApiResponse({ status: 200, description: 'Returns the client', type: ClientResponseDto })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async findById(@Param('id') id: string): Promise<ClientResponseDto> {
    const client = await this.clientService.findById(id);
    return ClientResponseDto.fromEntity(client);
  }

  @Post()
  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new client' })
  @ApiResponse({ status: 201, description: 'Client created', type: ClientResponseDto })
  async create(@Body() dto: CreateClientDto): Promise<ClientResponseDto> {
    const client = await this.clientService.create(dto);
    return ClientResponseDto.fromEntity(client);
  }

  @Delete(':id')
  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a client' })
  @ApiParam({ name: 'id', description: 'Client ID' })
  @ApiResponse({ status: 200, description: 'Client deleted' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  delete(@Param('id') id: string) {
    return this.clientService.delete(id);
  }
}
