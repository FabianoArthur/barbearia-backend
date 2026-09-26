import { Injectable, Logger } from '@nestjs/common';
import type Twilio from 'twilio';
import { maskPhone } from '../../../../common/utils/phone-mask.util';
import type {
  IWhatsAppProvider,
  WhatsAppMessage,
  WhatsAppSendResult,
} from '../../domain/interfaces/whatsapp-provider.interface';

@Injectable()
export class TwilioWhatsAppProvider implements IWhatsAppProvider {
  private readonly logger = new Logger(TwilioWhatsAppProvider.name);
  private readonly client: ReturnType<typeof Twilio>;
  private readonly from: string;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const rawFrom = process.env.TWILIO_WHATSAPP_FROM ?? '+14155238886';
    this.from = rawFrom.startsWith('whatsapp:') ? rawFrom : `whatsapp:${rawFrom}`;

    if (!accountSid || !authToken) {
      this.logger.warn('Twilio credentials not configured. WhatsApp messages will fail.');
    }

    // Dynamic import to avoid hard crash if credentials are missing
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const twilio = require('twilio') as typeof Twilio;
    this.client = twilio(accountSid ?? '', authToken ?? '');
  }

  async sendMessage(message: WhatsAppMessage): Promise<WhatsAppSendResult> {
    const formattedTo = message.to.startsWith('whatsapp:') ? message.to : `whatsapp:${message.to}`;

    this.logger.log(`Sending WhatsApp message to ${maskPhone(message.to)}`);

    const result = await this.client.messages.create({
      from: this.from,
      to: formattedTo,
      body: message.body,
    });

    this.logger.log(`WhatsApp message sent: SID=${result.sid}, status=${result.status}`);

    return {
      messageId: result.sid,
      status: result.status,
    };
  }
}
