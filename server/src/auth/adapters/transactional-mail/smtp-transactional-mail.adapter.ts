import { InternalServerErrorException } from '@nestjs/common';
import nodemailer, { type Transporter } from 'nodemailer';
import type {
  ITransactionalMailPort,
  OutboundEmailPayload,
} from '../../ports/transactional-mail.port';

export type SmtpMailConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromEmail: string;
  fromName: string;
  /** When false, allows self-signed certs (dev only). Default true. */
  rejectUnauthorized?: boolean;
};

export function createSmtpTransporter(config: SmtpMailConfig): Transporter {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.password,
    },
    tls:
      config.rejectUnauthorized === false
        ? { rejectUnauthorized: false }
        : undefined,
  });
}

export class SmtpTransactionalMailAdapter implements ITransactionalMailPort {
  constructor(
    private readonly transporter: Transporter,
    private readonly fromEmail: string,
    private readonly fromName: string,
  ) {}

  static fromConfig(config: SmtpMailConfig): SmtpTransactionalMailAdapter {
    return new SmtpTransactionalMailAdapter(
      createSmtpTransporter(config),
      config.fromEmail,
      config.fromName,
    );
  }

  async send(payload: OutboundEmailPayload): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: payload.to,
        subject: payload.subject,
        text: payload.text,
        html: payload.html,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      throw new InternalServerErrorException(
        `SMTP error: ${message.slice(0, 500)}`,
      );
    }
  }
}
