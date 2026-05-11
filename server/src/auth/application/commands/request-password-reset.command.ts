import {
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  generateOpaqueRefreshRaw,
  hashOpaqueRefreshRaw,
} from '../../adapters/utils/opaque-refresh-token.util';
import { passwordResetTokenExpiresAt } from '../../adapters/utils/password-reset-token-expiry.util';
import {
  buildPasswordResetLink,
  clientPublicBaseUrl,
  normalizePasswordResetLocale,
  type SupportedPasswordResetLocale,
} from '../../config/password-reset-public-url';
import type { IPasswordResetRepository } from '../../ports/password-reset.repository';
import { PASSWORD_RESET_REPOSITORY } from '../../ports/password-reset.repository';
import type { ITransactionalMailPort } from '../../ports/transactional-mail.port';
import { TRANSACTIONAL_MAIL_PORT } from '../../ports/transactional-mail.port';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export type RequestPasswordResetInput = {
  email: string;
  locale?: string;
};

/**
 * Demande de lien « mot de passe oublié » : si un compte avec mot de passe existe, enregistre un jeton opaque
 * et envoie l’e-mail. Réponse HTTP toujours neutre côté contrôleur (pas d’énumération d’emails).
 */
@Injectable()
export class RequestPasswordResetCommand {
  private readonly logger = new Logger(RequestPasswordResetCommand.name);

  constructor(
    @Inject(PASSWORD_RESET_REPOSITORY)
    private readonly passwordReset: IPasswordResetRepository,
    @Inject(TRANSACTIONAL_MAIL_PORT)
    private readonly mail: ITransactionalMailPort,
  ) {}

  async execute(input: RequestPasswordResetInput): Promise<void> {
    const email = input.email.trim().toLowerCase();
    const locale = normalizePasswordResetLocale(input.locale);
    const account = await this.passwordReset.findPasswordAccountByEmail(email);
    if (!account) {
      return;
    }

    const rawToken = generateOpaqueRefreshRaw();
    const tokenHash = hashOpaqueRefreshRaw(rawToken);
    const expiresAt = passwordResetTokenExpiresAt();
    await this.passwordReset.savePendingResetToken(
      account.userId,
      tokenHash,
      expiresAt,
    );

    const link = buildPasswordResetLink(
      clientPublicBaseUrl(),
      locale,
      rawToken,
    );
    const plainName = account.username;
    const htmlSafeName = escapeHtml(account.username);
    const { subject, text, html } = this.buildEmail(locale, plainName, htmlSafeName, link);

    try {
      await this.mail.send({
        to: account.email,
        subject,
        text,
        html,
      });
    } catch (err: unknown) {
      this.logger.error(
        `Password reset email failed for ${account.email}`,
        err instanceof Error ? err.stack : String(err),
      );
      throw new ServiceUnavailableException('Email delivery failed');
    }
  }

  private buildEmail(
    locale: SupportedPasswordResetLocale,
    plainUsername: string,
    htmlSafeUsername: string,
    link: string,
  ): { subject: string; text: string; html: string } {
    const href = escapeHtml(link);
    if (locale === 'fr') {
      return {
        subject: 'Réinitialisation du mot de passe — BugBountyApp',
        text: [
          `Bonjour ${plainUsername},`,
          '',
          'Une demande de réinitialisation de mot de passe a été faite pour votre compte.',
          'Si ce n’est pas vous, ignorez ce message.',
          '',
          `Lien (valide peu de temps) : ${link}`,
        ].join('\n'),
        html: `<p>Bonjour ${htmlSafeUsername},</p><p>Une demande de réinitialisation de mot de passe a été faite pour votre compte. Si ce n’est pas vous, ignorez ce message.</p><p><a href="${href}">Choisir un nouveau mot de passe</a></p>`,
      };
    }
    return {
      subject: 'Password reset — BugBountyApp',
      text: [
        `Hello ${plainUsername},`,
        '',
        'A password reset was requested for your account.',
        'If this was not you, you can ignore this email.',
        '',
        `Link (short-lived): ${link}`,
      ].join('\n'),
      html: `<p>Hello ${htmlSafeUsername},</p><p>A password reset was requested for your account. If this was not you, ignore this email.</p><p><a href="${href}">Set a new password</a></p>`,
    };
  }
}
