import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { SkipCsrf } from '../../../../common/decorators';
import { BarberService } from '../../../barber/application/services/barber.service';
import { EstablishmentService } from '../../../establishment/application/services/establishment.service';
import { ServiceService } from '../../../service/application/services/service.service';
import { GetAvailabilityQueryHandler } from '../../application/queries/get-availability.query-handler';
import { GetBarberAvailableHoursQueryHandler } from '../../application/queries/get-barber-available-hours.query-handler';
import { PublicBookingService } from '../../application/services/public-booking.service';
import { BarberAvailableHoursQueryDto } from '../dtos/barber-available-hours-query.dto';
import { CreatePublicAppointmentDto } from '../dtos/create-public-appointment.dto';
import { PublicBarberResponseDto } from '../dtos/public-barber-response.dto';
import { PublicEstablishmentResponseDto } from '../dtos/public-establishment-response.dto';
import { PublicServiceResponseDto } from '../dtos/public-service-response.dto';
import { RescheduleAppointmentDto } from '../dtos/reschedule-appointment.dto';

@ApiTags('Public Booking')
@SkipCsrf()
@Controller('public/booking')
export class PublicBookingController {
  constructor(
    private readonly establishmentService: EstablishmentService,
    private readonly barberService: BarberService,
    private readonly serviceService: ServiceService,
    private readonly availableHoursQuery: GetBarberAvailableHoursQueryHandler,
    private readonly availabilityQuery: GetAvailabilityQueryHandler,
    private readonly publicBookingService: PublicBookingService,
  ) {}

  // --- Catalog Endpoints ---

  @Get('establishments')
  @ApiOperation({ summary: 'List all establishments (public)' })
  @ApiResponse({
    status: 200,
    description: 'Returns public establishment list',
    type: [PublicEstablishmentResponseDto],
  })
  async listEstablishments(): Promise<PublicEstablishmentResponseDto[]> {
    const establishments = await this.establishmentService.findAll();
    return PublicEstablishmentResponseDto.fromEntities(establishments);
  }

  @Get('establishments/:id')
  @ApiOperation({ summary: 'Get establishment by ID (public)' })
  @ApiParam({ name: 'id', description: 'Establishment ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns a single public establishment',
    type: PublicEstablishmentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Establishment not found' })
  async getEstablishment(@Param('id') id: string): Promise<PublicEstablishmentResponseDto> {
    const establishment = await this.establishmentService.findById(id);
    return PublicEstablishmentResponseDto.fromEntity(establishment);
  }

  @Get('establishments/:establishmentId/services')
  @ApiOperation({ summary: 'List services for an establishment (public)' })
  @ApiParam({ name: 'establishmentId', description: 'Establishment ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns public service list for the establishment',
    type: [PublicServiceResponseDto],
  })
  async listServices(
    @Param('establishmentId') establishmentId: string,
  ): Promise<PublicServiceResponseDto[]> {
    const services = await this.serviceService.findAvailableByEstablishment(establishmentId);
    return PublicServiceResponseDto.fromEntities(services);
  }

  @Get('establishments/:establishmentId/services/:serviceId/barbers')
  @ApiOperation({
    summary: 'List barbers that offer a specific service in an establishment (public)',
  })
  @ApiParam({ name: 'establishmentId', description: 'Establishment ID' })
  @ApiParam({ name: 'serviceId', description: 'Service ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns public barber list filtered by service',
    type: [PublicBarberResponseDto],
  })
  async listBarbersByService(
    @Param('establishmentId') establishmentId: string,
    @Param('serviceId') serviceId: string,
  ): Promise<PublicBarberResponseDto[]> {
    const barbers = await this.barberService.findAllByService(serviceId);
    const filtered = barbers.filter((b) => b.establishmentId === establishmentId);
    return PublicBarberResponseDto.fromEntities(filtered);
  }

  @Get('establishments/:establishmentId/barbers')
  @ApiOperation({ summary: 'List barbers for an establishment (public)' })
  @ApiParam({ name: 'establishmentId', description: 'Establishment ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns public barber list for the establishment',
    type: [PublicBarberResponseDto],
  })
  async listBarbers(
    @Param('establishmentId') establishmentId: string,
  ): Promise<PublicBarberResponseDto[]> {
    const barbers = await this.barberService.findAllByEstablishment(establishmentId);
    return PublicBarberResponseDto.fromEntities(barbers);
  }

  @Get('barbers/:barberId/working-hours')
  @ApiOperation({
    summary: 'Get available working hours for a barber (public)',
    description:
      'Returns effective working hours per date, excluding past hours (for today) and time ranges occupied by active appointments.',
  })
  @ApiParam({ name: 'barberId', description: 'Barber ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns available working periods grouped by date (date, weekday, periods[])',
  })
  async getBarberWorkingHours(
    @Param('barberId') barberId: string,
    @Query() query: BarberAvailableHoursQueryDto,
  ) {
    return this.availableHoursQuery.execute(barberId, query.startDate, query.endDate);
  }

  // --- Booking Endpoints ---

  @Get('barbers/:barberId/availability')
  @ApiOperation({
    summary: 'Get available time slots for a barber on a specific date',
  })
  @ApiParam({ name: 'barberId', description: 'Barber ID' })
  @ApiQuery({
    name: 'date',
    required: true,
    description: 'Date in ISO format (e.g. 2026-03-15)',
  })
  @ApiQuery({
    name: 'serviceId',
    required: true,
    description: 'Service ID (used to determine slot duration)',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns list of available time slots',
  })
  getAvailability(
    @Param('barberId') barberId: string,
    @Query('date') date: string,
    @Query('serviceId') serviceId: string,
  ) {
    return this.availabilityQuery.execute(barberId, date, serviceId);
  }

  @Post('appointments')
  @ApiOperation({
    summary: 'Create a public appointment (auto-creates client if needed)',
  })
  @ApiResponse({ status: 201, description: 'Appointment created' })
  @ApiResponse({ status: 409, description: 'Time slot conflict' })
  createPublicAppointment(@Body() dto: CreatePublicAppointmentDto) {
    return this.publicBookingService.createPublicAppointment(dto);
  }

  @Post('appointments/:code/confirm')
  @Throttle({ default: { ttl: 600_000, limit: 5 } })
  @ApiOperation({ summary: 'Confirm an appointment by code (public)' })
  @ApiParam({ name: 'code', description: 'Appointment code' })
  @ApiResponse({ status: 200, description: 'Appointment confirmed' })
  @ApiResponse({ status: 400, description: 'Cannot confirm appointment' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  confirmByCode(@Param('code') code: string) {
    return this.publicBookingService.confirmByCode(code);
  }

  @Post('appointments/:code/cancel')
  @Throttle({ default: { ttl: 600_000, limit: 5 } })
  @ApiOperation({ summary: 'Cancel an appointment by code (public)' })
  @ApiParam({ name: 'code', description: 'Appointment code' })
  @ApiResponse({ status: 200, description: 'Appointment cancelled' })
  @ApiResponse({ status: 400, description: 'Cannot cancel appointment' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  cancelByCode(@Param('code') code: string) {
    return this.publicBookingService.cancelByCode(code);
  }

  @Post('appointments/:code/reschedule')
  @Throttle({ default: { ttl: 600_000, limit: 5 } })
  @ApiOperation({ summary: 'Reschedule an appointment by code (public)' })
  @ApiParam({ name: 'code', description: 'Appointment code' })
  @ApiResponse({ status: 200, description: 'Appointment rescheduled' })
  @ApiResponse({ status: 400, description: 'Cannot reschedule appointment' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  @ApiResponse({ status: 409, description: 'New time slot conflicts' })
  rescheduleByCode(@Param('code') code: string, @Body() dto: RescheduleAppointmentDto) {
    return this.publicBookingService.rescheduleByCode(code, dto.startsAt);
  }
}
