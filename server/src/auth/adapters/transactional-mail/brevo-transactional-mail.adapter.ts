import { InternalServerErrorException } from '@nestjs/common';
import type {
  ITransactionalMailPort,
  OutboundEmailPayload,
} from '../../ports/transactional-mail.port';

export class BrevoTransactionalMailAdapter implements ITransactionalMailPort {
  constructor(
    private readonly apiKey: string,
    private readonly fromEmail: string,
    private readonly fromName: string,
  ) {}

  async send(payload: OutboundEmailPayload): Promise<void> {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': this.apiKey,
      },
      body: JSON.stringify({
        sender: { name: this.fromName, email: this.fromEmail },
        to: [{ email: payload.to }],
        subject: payload.subject,
        textContent: payload.text,
        htmlContent: payload.html,
      }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new InternalServerErrorException(
        `Brevo error ${res.status}: ${errText.slice(0, 500)}`,
      );
    }
  }
}
