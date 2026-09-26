import { Inject, Injectable, Logger } from '@nestjs/common';
import { maskCpf } from '../../../../common/utils/cpf-mask.util';
import { safeDecrypt } from '../../../../common/utils/encryption.util';
import type { AppointmentWithRelations } from '../../../appointment/domain/interfaces/appointment-repository.interface';
import {
  type IWhatsAppProvider,
  WHATSAPP_PROVIDER,
  type WhatsAppSendResult,
} from '../../domain/interfaces/whatsapp-provider.interface';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly confirmationBaseUrl: string;

  constructor(
    @Inject(WHATSAPP_PROVIDER)
    private readonly whatsAppProvider: IWhatsAppProvider,
  ) {
    this.confirmationBaseUrl =
      process.env.PUBLIC_CONFIRMATION_URL ?? 'https://yourdomain.com/confirm';
  }

  async sendConfirmationWhatsApp(
    appointment: AppointmentWithRelations,
  ): Promise<WhatsAppSendResult> {
    const encryptedPhone = appointment.client.phone;

    if (!encryptedPhone) {
      throw new Error(
        `Client ${appointment.clientId} has no phone number for appointment ${appointment.id}`,
      );
    }

    const phone = safeDecrypt(encryptedPhone);
    const confirmationLink = `${this.confirmationBaseUrl}?appointmentId=${appointment.id}`;

    const body = this.buildConfirmationMessage({
      clientName: appointment.client.name,
      maskedCpf: maskCpf(safeDecrypt(appointment.client.cpf)),
      appointmentCode: appointment.publicCancelCode ?? appointment.id.slice(0, 8),
      barberName: appointment.barber.user.name,
      confirmationLink,
      startsAt: appointment.startsAt,
    });

    this.logger.log(`Sending confirmation WhatsApp for appointment ${appointment.id}`);

    return this.whatsAppProvider.sendMessage({ to: phone, body });
  }

  async sendReminderWhatsApp(appointment: AppointmentWithRelations): Promise<WhatsAppSendResult> {
    const encryptedPhone = appointment.client.phone;

    if (!encryptedPhone) {
      throw new Error(
        `Client ${appointment.clientId} has no phone number for appointment ${appointment.id}`,
      );
    }

    const phone = safeDecrypt(encryptedPhone);

    const body = this.buildReminderMessage({
      clientName: appointment.client.name,
      barberName: appointment.barber.user.name,
      startsAt: appointment.startsAt,
    });

    this.logger.log(`Sending reminder WhatsApp for appointment ${appointment.id}`);

    return this.whatsAppProvider.sendMessage({ to: phone, body });
  }

  private buildReminderMessage(data: {
    clientName: string;
    barberName: string;
    startsAt: Date;
  }): string {
    const time = data.startsAt.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return [
      `Olá, ${data.clientName}!`,
      '',
      `Lembrete: seu horário com ${data.barberName} é daqui a 30 minutos (${time}).`,
      '',
      'Até já!',
    ].join('\n');
  }

  private buildConfirmationMessage(data: {
    clientName: string;
    maskedCpf: string;
    appointmentCode: string;
    barberName: string;
    confirmationLink: string;
    startsAt: Date;
  }): string {
    const time = data.startsAt.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return [
      `Olá, ${data.clientName}!`,
      '',
      `Você tem um agendamento hoje às ${time} com ${data.barberName}.`,
      `CPF: ${data.maskedCpf}`,
      `Código: ${data.appointmentCode}`,
      '',
      'Confirme sua presença clicando no link abaixo:',
      data.confirmationLink,
      '',
      'Caso não possa comparecer, entre em contato com a barbearia.',
    ].join('\n');
  }
}
