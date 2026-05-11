import { Logger } from '@nestjs/common';
import { BrevoTransactionalMailAdapter } from './brevo-transactional-mail.adapter';
import { ConsoleTransactionalMailAdapter } from './console-transactional-mail.adapter';
import { MailgunTransactionalMailAdapter } from './mailgun-transactional-mail.adapter';
import type { ITransactionalMailPort } from '../../ports/transactional-mail.port';

const logger = new Logger('TransactionalMailFactory');

function mailFrom(): { email: string; name: string } {
  const email =
    process.env.MAIL_FROM_EMAIL?.trim() || 'noreply@localhost';
  const name = process.env.MAIL_FROM_NAME?.trim() || 'BugBountyApp';
  return { email, name };
}

/**
 * Un seul fournisseur actif via `MAIL_PROVIDER` : console, mailgun ou brevo.
 * Une seule clé secrète partagée : `MAIL_TRANSACTIONAL_API_KEY` (Brevo, SendGrid, clé API Mailgun, etc.).
 */
export function createTransactionalMailPort(): ITransactionalMailPort {
  const provider = (process.env.MAIL_PROVIDER ?? 'console').trim().toLowerCase();
  const from = mailFrom();

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
