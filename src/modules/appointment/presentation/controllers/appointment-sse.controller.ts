import type { MessageEvent } from '@nestjs/common';
import { Controller, Param, Sse, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { type Observable } from 'rxjs';
import { AppointmentSseService } from '../../application/services/appointment-sse.service';

@ApiTags('SSE')
@ApiBearerAuth()
@Controller('sse')
@UseGuards(AuthGuard('jwt'))
export class AppointmentSseController {
  constructor(private readonly appointmentSseService: AppointmentSseService) {}

  @Sse('barber/:barberId/dashboard')
  @ApiOperation({
    summary: 'Barber dashboard real-time updates',
    description:
      'Server-Sent Events stream for real-time booking status changes on the barber dashboard.',
  })
  @ApiParam({ name: 'barberId', description: 'Barber ID to subscribe to' })
  barberDashboard(@Param('barberId') barberId: string): Observable<MessageEvent> {
    return this.appointmentSseService.subscribe(barberId);
  }
}
