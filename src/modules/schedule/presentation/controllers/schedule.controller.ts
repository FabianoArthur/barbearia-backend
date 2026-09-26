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
import { ScheduleService } from '../../application/services/schedule.service';
import { CreateScheduleOverrideDto } from '../dtos/create-schedule-override.dto';
import { CreateTimeOffDto } from '../dtos/create-time-off.dto';
import { CreateWorkingHourDto } from '../dtos/create-working-hour.dto';

@ApiTags('Schedule')
@ApiBearerAuth()
@ApiSecurity('csrf-token')
@Controller('schedule')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  // --- Working Hours ---

  @Get('working-hours/:barberId')
  @ApiOperation({ summary: 'Get working hours for a barber' })
  @ApiParam({ name: 'barberId', description: 'Barber ID' })
  @ApiResponse({ status: 200, description: 'Returns list of working hours' })
  getWorkingHours(@Param('barberId') barberId: string) {
    return this.scheduleService.getWorkingHours(barberId);
  }

  @Post('working-hours')
  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a working hour entry for a barber' })
  @ApiResponse({ status: 201, description: 'Working hour created' })
  createWorkingHour(@Body() dto: CreateWorkingHourDto) {
    return this.scheduleService.createWorkingHour(dto);
  }

  @Delete('working-hours/:id')
  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a working hour entry' })
  @ApiParam({ name: 'id', description: 'Working hour ID' })
  @ApiResponse({ status: 200, description: 'Working hour deleted' })
  deleteWorkingHour(@Param('id') id: string) {
    return this.scheduleService.deleteWorkingHour(id);
  }

  // --- Time Off ---

  @Get('time-off/:barberId')
  @ApiOperation({ summary: 'Get time off entries for a barber' })
  @ApiParam({ name: 'barberId', description: 'Barber ID' })
  @ApiResponse({ status: 200, description: 'Returns list of time off entries' })
  getTimeOffs(@Param('barberId') barberId: string) {
    return this.scheduleService.getTimeOffs(barberId);
  }

  @Post('time-off')
  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a time off entry for a barber' })
  @ApiResponse({ status: 201, description: 'Time off created' })
  createTimeOff(@Body() dto: CreateTimeOffDto) {
    return this.scheduleService.createTimeOff(dto);
  }

  @Delete('time-off/:id')
  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a time off entry' })
  @ApiParam({ name: 'id', description: 'Time off ID' })
  @ApiResponse({ status: 200, description: 'Time off deleted' })
  deleteTimeOff(@Param('id') id: string) {
    return this.scheduleService.deleteTimeOff(id);
  }

  // --- Schedule Override ---

  @Get('overrides/:barberId')
  @ApiOperation({ summary: 'Get schedule overrides for a barber' })
  @ApiParam({ name: 'barberId', description: 'Barber ID' })
  @ApiResponse({ status: 200, description: 'Returns list of schedule overrides' })
  getScheduleOverrides(@Param('barberId') barberId: string) {
    return this.scheduleService.getScheduleOverrides(barberId);
  }

  @Post('overrides')
  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a schedule override for a barber' })
  @ApiResponse({ status: 201, description: 'Schedule override created' })
  createScheduleOverride(@Body() dto: CreateScheduleOverrideDto) {
    return this.scheduleService.createScheduleOverride(dto);
  }

  @Delete('overrides/:id')
  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a schedule override' })
  @ApiParam({ name: 'id', description: 'Schedule override ID' })
  @ApiResponse({ status: 200, description: 'Schedule override deleted' })
  deleteScheduleOverride(@Param('id') id: string) {
    return this.scheduleService.deleteScheduleOverride(id);
  }
}
