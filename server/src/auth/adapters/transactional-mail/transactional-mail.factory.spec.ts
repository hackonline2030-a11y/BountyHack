import { ConsoleTransactionalMailAdapter } from './console-transactional-mail.adapter';
import { createTransactionalMailPort } from './transactional-mail.factory';
import { SmtpTransactionalMailAdapter } from './smtp-transactional-mail.adapter';

describe('createTransactionalMailPort', () => {
  const env = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...env };
  });

  afterAll(() => {
    process.env = env;
  });

  it('returns console when MAIL_PROVIDER is console', () => {
    process.env.MAIL_PROVIDER = 'console';
    expect(createTransactionalMailPort()).toBeInstanceOf(
      ConsoleTransactionalMailAdapter,
    );
  });

  it('returns console when MAIL_PROVIDER is smtp but SMTP config is incomplete', () => {
    process.env.MAIL_PROVIDER = 'smtp';
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASSWORD;
    expect(createTransactionalMailPort()).toBeInstanceOf(
      ConsoleTransactionalMailAdapter,
    );
  });

  it('returns SmtpTransactionalMailAdapter when SMTP env is complete', () => {
    process.env.MAIL_PROVIDER = 'smtp';
    process.env.SMTP_HOST = 'mail.example.com';
    process.env.SMTP_PORT = '465';
    process.env.SMTP_SECURE = 'true';
    process.env.SMTP_USER = 'noreply@example.com';
    process.env.SMTP_PASSWORD = 'secret';
    process.env.MAIL_FROM_EMAIL = 'noreply@example.com';
    process.env.MAIL_FROM_NAME = 'App';

    expect(createTransactionalMailPort()).toBeInstanceOf(
      SmtpTransactionalMailAdapter,
    );
  });
});
