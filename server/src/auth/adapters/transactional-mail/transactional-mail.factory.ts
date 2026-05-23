import { Logger } from '@nestjs/common';
import { BrevoTransactionalMailAdapter } from './brevo-transactional-mail.adapter';
import { ConsoleTransactionalMailAdapter } from './console-transactional-mail.adapter';
import { MailgunTransactionalMailAdapter } from './mailgun-transactional-mail.adapter';
import { SmtpTransactionalMailAdapter } from './smtp-transactional-mail.adapter';
import type { ITransactionalMailPort } from '../../ports/transactional-mail.port';

const logger = new Logger('TransactionalMailFactory');

function mailFrom(): { email: string; name: string } {
  const email =
    process.env.MAIL_FROM_EMAIL?.trim() || 'noreply@localhost';
  const name = process.env.MAIL_FROM_NAME?.trim() || 'BugBountyApp';
  return { email, name };
}

function parseSmtpPort(raw: string | undefined): number {
  const n = Number(raw?.trim() || '465');
  return Number.isFinite(n) && n > 0 ? n : 465;
}

function parseSmtpSecure(raw: string | undefined, port: number): boolean {
  const value = raw?.trim().toLowerCase();
  if (value === 'true' || value === '1' || value === 'yes') {
    return true;
  }
  if (value === 'false' || value === '0' || value === 'no') {
    return false;
  }
  return port === 465;
}

function readSmtpConfig(from: { email: string; name: string }) {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const password = process.env.SMTP_PASSWORD?.trim();
  if (!host || !user || !password) {
    return null;
  }
  const port = parseSmtpPort(process.env.SMTP_PORT);
  const secure = parseSmtpSecure(process.env.SMTP_SECURE, port);
  const rejectUnauthorized =
    process.env.SMTP_REJECT_UNAUTHORIZED?.trim().toLowerCase() !== 'false';
  return {
    host,
    port,
    secure,
    user,
    password,
    fromEmail: from.email,
    fromName: from.name,
    rejectUnauthorized,
  };
}

/**
 * Un seul fournisseur actif via `MAIL_PROVIDER` : console, mailgun, brevo ou smtp.
 * API keys : `MAIL_TRANSACTIONAL_API_KEY` (Brevo, Mailgun). SMTP : `SMTP_HOST`, `SMTP_USER`, etc.
 */
export function createTransactionalMailPort(): ITransactionalMailPort {
  const provider = (process.env.MAIL_PROVIDER ?? 'console').trim().toLowerCase();
  const from = mailFrom();

  if (provider === 'smtp') {
    const smtp = readSmtpConfig(from);
    if (!smtp) {
      logger.warn(
        'MAIL_PROVIDER=smtp but SMTP_HOST, SMTP_USER or SMTP_PASSWORD missing — falling back to console',
      );
      return new ConsoleTransactionalMailAdapter();
    }
    return SmtpTransactionalMailAdapter.fromConfig(smtp);
  }

  if (provider === 'mailgun') {
    const apiKey = process.env.MAIL_TRANSACTIONAL_API_KEY?.trim();
    const domain = process.env.MAILGUN_DOMAIN?.trim();
    if (!apiKey || !domain) {
      logger.warn(
        'MAIL_PROVIDER=mailgun but MAIL_TRANSACTIONAL_API_KEY or MAILGUN_DOMAIN missing — falling back to console',
      );
      return new ConsoleTransactionalMailAdapter();
    }
    const regionRaw = (process.env.MAILGUN_REGION ?? 'us').trim().toLowerCase();
    const region = regionRaw === 'eu' ? 'eu' : 'us';
    return new MailgunTransactionalMailAdapter(
      apiKey,
      domain,
      from.email,
      from.name,
      region,
    );
  }

  if (provider === 'brevo') {
    const apiKey = process.env.MAIL_TRANSACTIONAL_API_KEY?.trim();
    if (!apiKey) {
      logger.warn(
        'MAIL_PROVIDER=brevo but MAIL_TRANSACTIONAL_API_KEY missing — falling back to console',
      );
      return new ConsoleTransactionalMailAdapter();
    }
    return new BrevoTransactionalMailAdapter(apiKey, from.email, from.name);
  }

  if (provider !== 'console') {
    logger.warn(`Unknown MAIL_PROVIDER="${provider}" — using console`);
  }
  return new ConsoleTransactionalMailAdapter();
}
