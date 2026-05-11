import { InternalServerErrorException } from '@nestjs/common';
import type {
  ITransactionalMailPort,
  OutboundEmailPayload,
} from '../../ports/transactional-mail.port';

export class MailgunTransactionalMailAdapter implements ITransactionalMailPort {
  constructor(
    private readonly apiKey: string,
    private readonly domain: string,
    private readonly fromEmail: string,
    private readonly fromName: string,
    private readonly region: 'us' | 'eu',
  ) {}

  async send(payload: OutboundEmailPayload): Promise<void> {
    const host =
      this.region === 'eu' ? 'https://api.eu.mailgun.net' : 'https://api.mailgun.net';
    const url = `${host}/v3/${encodeURIComponent(this.domain)}/messages`;
    const body = new URLSearchParams();
    body.set('from', `${this.fromName} <${this.fromEmail}>`);
    body.set('to', payload.to);
    body.set('subject', payload.subject);
    body.set('text', payload.text);
    body.set('html', payload.html);

    const auth = Buffer.from(`api:${this.apiKey}`, 'utf8').toString('base64');
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new InternalServerErrorException(
        `Mailgun error ${res.status}: ${errText.slice(0, 500)}`,
      );
    }
  }
}
