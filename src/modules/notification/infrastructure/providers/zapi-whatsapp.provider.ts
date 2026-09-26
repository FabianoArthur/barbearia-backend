import { Injectable, Logger } from '@nestjs/common';
import { maskPhone } from '../../../../common/utils/phone-mask.util';
import type {
  IWhatsAppProvider,
  WhatsAppMessage,
  WhatsAppSendResult,
} from '../../domain/interfaces/whatsapp-provider.interface';

interface ZApiSendTextResponse {
  readonly zaapId: string;
  readonly messageId: string;
}

@Injectable()
export class ZApiWhatsAppProvider implements IWhatsAppProvider {
  private readonly logger = new Logger(ZApiWhatsAppProvider.name);
  private readonly baseUrl: string;
  private readonly clientToken: string | undefined;

  constructor() {
    const instanceId = process.env.ZAPI_INSTANCE_ID;
    const token = process.env.ZAPI_TOKEN;
    this.clientToken = process.env.ZAPI_CLIENT_TOKEN;

    if (!instanceId || !token) {
      this.logger.warn('Z-API credentials not configured. WhatsApp messages will fail.');
    }

    this.baseUrl = `https://api.z-api.io/instances/${instanceId ?? ''}/token/${token ?? ''}`;
  }

  async sendMessage(message: WhatsAppMessage): Promise<WhatsAppSendResult> {
    const phone = message.to.replace(/\D/g, '');

    this.logger.log(`Sending WhatsApp message to ${maskPhone(phone)}`);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.clientToken) {
      headers['Client-Token'] = this.clientToken;
    }

    const response = await fetch(`${this.baseUrl}/send-text`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ phone, message: message.body }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Z-API request failed (${response.status}): ${errorBody}`);
    }

    const result: ZApiSendTextResponse = await response.json();

    this.logger.log(
      `WhatsApp message sent: zaapId=${result.zaapId}, messageId=${result.messageId}`,
    );

    return {
      messageId: result.messageId,
      status: 'sent',
    };
  }
}
