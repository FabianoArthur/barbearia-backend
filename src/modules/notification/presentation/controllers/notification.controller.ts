import {
  BadRequestException,
  Controller,
  Inject,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { AppointmentStatus, Role } from '@prisma/client';
import { Roles } from '../../../../common/decorators';
import { RolesGuard } from '../../../../common/guards';
import {
  APPOINTMENT_REPOSITORY,
  type IAppointmentRepository,
} from '../../../appointment/domain/interfaces/appointment-repository.interface';
import { ConfirmationCronService } from '../../application/services/confirmation-cron.service';
import { NotificationService } from '../../application/services/notification.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@ApiSecurity('csrf-token')
@Controller('notifications')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class NotificationController {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepository: IAppointmentRepository,
    private readonly confirmationCronService: ConfirmationCronService,
    private readonly notificationService: NotificationService,
  ) {}

  @Post('send-confirmation/:appointmentId')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Manually trigger confirmation WhatsApp',
    description:
      'Sends the confirmation WhatsApp for a SCHEDULED appointment. Performs the same status transition (SCHEDULED -> CONFIRMATION_PENDING), audit logging, and WhatsApp delivery as the automated cron.',
  })
  @ApiParam({ name: 'appointmentId', description: 'Appointment ID' })
  @ApiResponse({ status: 200, description: 'Confirmation sent and status transitioned' })
  @ApiResponse({
    status: 400,
    description: 'Appointment is not in SCHEDULED status or has no phone',
  })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async sendConfirmation(@Param('appointmentId') appointmentId: string) {
    const appointment = await this.appointmentRepository.findById(appointmentId);

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.status !== AppointmentStatus.SCHEDULED) {
      throw new BadRequestException(
        `Appointment must be SCHEDULED to send confirmation. Current status: ${appointment.status}`,
      );
    }

    if (!appointment.client.phone) {
      throw new BadRequestException('Client has no phone number');
    }

    // Runs the exact same flow as the cron: atomic lock, status transition,
    // audit log, WhatsApp send, WhatsApp info update, revert on failure.
    await this.confirmationCronService.processAppointment(appointmentId);

    return { sent: true, appointmentId };
  }

  @Post('send-reminder/:appointmentId')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Manually trigger reminder WhatsApp',
    description:
      'Sends the reminder WhatsApp for a CONFIRMED appointment that has not yet received a reminder. Updates reminderSentAt and stores the Twilio message SID.',
  })
  @ApiParam({ name: 'appointmentId', description: 'Appointment ID' })
  @ApiResponse({ status: 200, description: 'Reminder sent' })
  @ApiResponse({ status: 400, description: 'Invalid state for sending reminder' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async sendReminder(@Param('appointmentId') appointmentId: string) {
    const appointment = await this.appointmentRepository.findById(appointmentId);

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.status !== AppointmentStatus.CONFIRMED) {
      throw new BadRequestException(
        `Appointment must be CONFIRMED to send reminder. Current status: ${appointment.status}`,
      );
    }

    if (appointment.reminderSentAt) {
      throw new BadRequestException('Reminder was already sent for this appointment');
    }

    if (!appointment.client.phone) {
      throw new BadRequestException('Client has no phone number');
    }

    const result = await this.notificationService.sendReminderWhatsApp(appointment);

    await this.appointmentRepository.updateReminderSentAt(appointmentId, result.messageId);

    return {
      sent: true,
      appointmentId,
      messageId: result.messageId,
      status: result.status,
    };
  }
}
