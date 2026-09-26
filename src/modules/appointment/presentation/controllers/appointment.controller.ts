import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { AppointmentStatus, Role } from '@prisma/client';
import { CurrentUser, Roles } from '../../../../common/decorators';
import { PaginatedResponseDto, PaginationMeta } from '../../../../common/dtos';
import { RolesGuard } from '../../../../common/guards';
import { BarberDailySummaryQueryHandler } from '../../application/queries/barber-daily-summary.query-handler';
import { FindAppointmentsQueryHandler } from '../../application/queries/find-appointments.query-handler';
import { AppointmentService } from '../../application/services/appointment.service';
import { AppointmentListItemDto } from '../dtos/appointment-list-item.dto';
import { CreateAppointmentDto } from '../dtos/create-appointment.dto';
import { FindAppointmentsQueryDto } from '../dtos/find-appointments-query.dto';
import { UpdateStatusDto } from '../dtos/update-status.dto';
import { sanitizeAppointment } from '../mappers/sanitize-appointment';

@ApiTags('Appointments')
@ApiBearerAuth()
@ApiSecurity('csrf-token')
@ApiExtraModels(PaginationMeta, AppointmentListItemDto)
@Controller('appointments')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AppointmentController {
  constructor(
    private readonly appointmentService: AppointmentService,
    private readonly findAppointmentsQuery: FindAppointmentsQueryHandler,
    private readonly barberDailySummaryQuery: BarberDailySummaryQueryHandler,
  ) {}

  @Get()
  @Roles(Role.BARBER, Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'List appointments with pagination and filters',
    description:
      'Returns a paginated list of appointments. Filter by establishment, barber, date range, and status.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of appointments with total revenue',
    schema: {
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/AppointmentListItemDto' },
          description: 'List of appointment records',
        },
        meta: {
          $ref: '#/components/schemas/PaginationMeta',
        },
        totalRevenue: {
          type: 'number',
          description:
            'Sum of priceSnapshot across all matching appointments (not just the current page)',
          example: 1250.0,
        },
      },
    },
  })
  async findAll(@Query() query: FindAppointmentsQueryDto) {
    const { data, total, totalRevenue, page, limit } =
      await this.findAppointmentsQuery.execute(query);
    return {
      ...new PaginatedResponseDto(AppointmentListItemDto.fromDomainList(data), total, page, limit),
      totalRevenue,
    };
  }

  @Get('barber/:barberId/daily-summary')
  @Roles(Role.BARBER, Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Barber daily summary',
    description:
      'Returns appointments for a barber on a given date with completed count and commission total.',
  })
  @ApiParam({ name: 'barberId', description: 'Barber ID' })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Date in YYYY-MM-DD format (default: today)',
    example: '2025-02-16',
  })
  @ApiResponse({ status: 200, description: 'Daily summary with appointments and totals' })
  async getBarberDailySummary(@Param('barberId') barberId: string, @Query('date') date?: string) {
    const dateStr = date ?? new Date().toISOString().slice(0, 10);
    return this.barberDailySummaryQuery.execute(barberId, dateStr);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get appointment by ID' })
  @ApiParam({ name: 'id', description: 'Appointment ID' })
  @ApiResponse({ status: 200, description: 'Returns the appointment' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async findById(@Param('id') id: string) {
    const appointment = await this.appointmentService.findById(id);
    return sanitizeAppointment(appointment);
  }

  @Post()
  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new appointment' })
  @ApiResponse({
    status: 201,
    description: 'Appointment created with price snapshot',
  })
  @ApiResponse({ status: 409, description: 'Time slot conflict' })
  create(@Body() dto: CreateAppointmentDto) {
    return this.appointmentService.create(dto);
  }

  @Patch(':id/status')
  @Roles(Role.BARBER, Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update appointment status (generic)' })
  @ApiParam({ name: 'id', description: 'Appointment ID' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.appointmentService.transitionStatus(id, dto.status, userId);
  }

  @Post(':id/start')
  @Roles(Role.BARBER, Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Start an appointment (transition to IN_PROGRESS)' })
  @ApiParam({ name: 'id', description: 'Appointment ID' })
  @ApiResponse({ status: 200, description: 'Appointment started' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  startAppointment(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.appointmentService.transitionStatus(id, AppointmentStatus.IN_PROGRESS, userId);
  }

  @Post(':id/finish')
  @Roles(Role.BARBER, Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Finish an appointment (transition to DONE, creates finance record)',
  })
  @ApiParam({ name: 'id', description: 'Appointment ID' })
  @ApiResponse({ status: 200, description: 'Appointment finished' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  finishAppointment(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.appointmentService.transitionStatus(id, AppointmentStatus.DONE, userId);
  }

  @Post(':id/no-show')
  @Roles(Role.BARBER, Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Mark appointment as no-show' })
  @ApiParam({ name: 'id', description: 'Appointment ID' })
  @ApiResponse({ status: 200, description: 'Marked as no-show' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  noShowAppointment(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.appointmentService.transitionStatus(id, AppointmentStatus.NO_SHOW, userId);
  }

  @Post(':id/cancel')
  @Roles(Role.BARBER, Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Cancel an appointment' })
  @ApiParam({ name: 'id', description: 'Appointment ID' })
  @ApiResponse({ status: 200, description: 'Appointment canceled' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  cancelAppointment(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.appointmentService.transitionStatus(id, AppointmentStatus.CANCELED, userId);
  }

  @Delete(':id')
  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an appointment' })
  @ApiParam({ name: 'id', description: 'Appointment ID' })
  @ApiResponse({ status: 204, description: 'Appointment deleted' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  deleteAppointment(@Param('id') id: string) {
    return this.appointmentService.delete(id);
  }
}
