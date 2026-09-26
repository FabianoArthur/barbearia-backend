export interface WhatsAppMessage {
  readonly to: string;
  readonly body: string;
}

export interface WhatsAppSendResult {
  readonly messageId: string;
  readonly status: string;
}

export interface IWhatsAppProvider {
  sendMessage(message: WhatsAppMessage): Promise<WhatsAppSendResult>;
}

export const WHATSAPP_PROVIDER = Symbol('WHATSAPP_PROVIDER');
