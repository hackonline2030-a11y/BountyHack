import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
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
import { isPrismaSqlMode } from '../../../shared/database-mode';
import {
  I_USER_REPOSITORY,
  IUserRepository,
} from '../../../users/ports/user-repository.interface';
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

export type AdminForcePasswordResetInput = {
  userId: string;
  locale?: string;
};

@Injectable()
export class AdminForcePasswordResetCommand {
  private readonly logger = new Logger(AdminForcePasswordResetCommand.name);

  constructor(
    @Inject(I_USER_REPOSITORY)
    private readonly users: IUserRepository,
    @Optional()
    @Inject(PASSWORD_RESET_REPOSITORY)
    private readonly passwordReset: IPasswordResetRepository | null,
    @Optional()
    @Inject(TRANSACTIONAL_MAIL_PORT)
    private readonly mail: ITransactionalMailPort | null,
  ) {}

  async execute(input: AdminForcePasswordResetInput): Promise<{ ok: true }> {
    if (!isPrismaSqlMode() || !this.passwordReset || !this.mail) {
      throw new BadRequestException(
        'Force password reset requires POSTGRESQL_PRISMA or MYSQL_PRISMA and mail configuration',
      );
    }

    const userId = input.userId.trim();
    const activation = await this.users.findAdminActivationById(userId);
    if (!activation) {
      throw new NotFoundException('User not found');
    }
    if (!activation.hasPasswordHash) {
      throw new BadRequestException(
        'User has no password yet; use resend invitation instead',
      );
    }
    if (!activation.email) {
      throw new BadRequestException('User has no email address');
    }

    await this.users.clearPasswordForAdminReset(userId);

    const rawToken = generateOpaqueRefreshRaw();
    const tokenHash = hashOpaqueRefreshRaw(rawToken);
    const expiresAt = passwordResetTokenExpiresAt();
    await this.passwordReset.savePendingResetToken(userId, tokenHash, expiresAt);

    const locale = normalizePasswordResetLocale(input.locale) as SupportedPasswordResetLocale;
    const link = buildPasswordResetLink(clientPublicBaseUrl(), locale, rawToken);
    const htmlSafeName = escapeHtml(activation.username);
    const { subject, text, html } = this.buildEmail(
      locale,
      activation.username,
      htmlSafeName,
      link,
    );

    try {
      await this.mail.send({
        to: activation.email,
        subject,
        text,
        html,
      });
    } catch (err: unknown) {
      this.logger.error(
        `Admin force password reset email failed for ${activation.email}`,
        err instanceof Error ? err.stack : String(err),
      );
      throw new ServiceUnavailableException('Email delivery failed');
    }

    return { ok: true };
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
        subject: 'Renouvellement du mot de passe — BugBountyApp',
        text: [
          `Bonjour ${plainUsername},`,
          '',
          'Un administrateur a demandé le renouvellement de votre mot de passe.',
          'Votre ancien mot de passe ne fonctionne plus. Choisissez-en un nouveau via le lien ci-dessous (valide peu de temps) :',
          '',
          link,
        ].join('\n'),
        html: `<p>Bonjour ${htmlSafeUsername},</p><p>Un administrateur a demandé le renouvellement de votre mot de passe. Votre ancien mot de passe ne fonctionne plus.</p><p><a href="${href}">Choisir un nouveau mot de passe</a></p>`,
      };
    }
    return {
      subject: 'Password renewal — BugBountyApp',
      text: [
        `Hello ${plainUsername},`,
        '',
        'An administrator requested a password renewal for your account.',
        'Your previous password no longer works. Set a new one using the link below (short-lived):',
        '',
        link,
      ].join('\n'),
      html: `<p>Hello ${htmlSafeUsername},</p><p>An administrator requested a password renewal for your account. Your previous password no longer works.</p><p><a href="${href}">Set a new password</a></p>`,
    };
  }
}
