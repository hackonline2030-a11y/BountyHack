import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  Optional,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { isPrismaSqlMode } from '../../../shared/database-mode';
import type { AuthenticatedUserProfile } from '../models/authenticated-session';
import type { RegisterWithPasswordInput } from '../models/register-with-password.input';
import type { RegisterUserByAdminResult } from '../models/register-user-by-admin.result';
import { IssuePasswordSetupTokenService } from '../services/issue-password-setup-token.service';
import type { ITransactionalMailPort } from '../../ports/transactional-mail.port';
import { TRANSACTIONAL_MAIL_PORT } from '../../ports/transactional-mail.port';
import { AuthRepository } from '../../ports/auth.repository';
import {
  normalizeAccountSetupLocale,
  type SupportedPasswordResetLocale,
} from '../../config/account-setup-public-url';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

@Injectable()
export class RegisterUserByAdminCommand {
  private readonly logger = new Logger(RegisterUserByAdminCommand.name);

  constructor(
    @Inject(AuthRepository)
    private readonly authRepository: AuthRepository,
    @Optional()
    private readonly issueSetupToken: IssuePasswordSetupTokenService | null,
    @Optional()
    @Inject(TRANSACTIONAL_MAIL_PORT)
    private readonly mail: ITransactionalMailPort | null,
  ) {}

  async execute(input: RegisterWithPasswordInput): Promise<RegisterUserByAdminResult> {
    const email = input.email.trim().toLowerCase();
    const username = input.username.trim();
    const password = input.password?.trim();

    if (!email || !username) {
      throw new UnauthorizedException('Missing credentials');
    }

    if (password) {
      const session = await this.authRepository.register({
        email,
        username,
        password,
        roleCode: input.roleCode,
      });
      return { kind: 'session', session };
    }

    if (!isPrismaSqlMode()) {
      throw new BadRequestException(
        'Admin invitation (register without password) requires POSTGRESQL_PRISMA or MYSQL_PRISMA',
      );
    }

    if (!this.issueSetupToken || !this.mail) {
      throw new ServiceUnavailableException(
        'Account invitation requires Prisma SQL mode and mail configuration',
      );
    }

    const user = await this.authRepository.registerPendingActivation({
      email,
      username,
      roleCode: input.roleCode,
    });

    const locale = normalizeAccountSetupLocale(input.locale);
    const { link } = await this.issueSetupToken.issueForUser(user.uid, locale);

    await this.sendWelcomeEmail(this.mail, user, locale, link);

    return { kind: 'invitation', user, invitationSent: true };
  }

  private async sendWelcomeEmail(
    mail: ITransactionalMailPort,
    user: AuthenticatedUserProfile,
    locale: SupportedPasswordResetLocale,
    link: string,
  ): Promise<void> {
    const plainName = user.username;
    const htmlSafeName = escapeHtml(user.username);
    const href = escapeHtml(link);
    const { subject, text, html } = this.buildWelcomeEmail(
      locale,
      plainName,
      htmlSafeName,
      link,
      href,
    );

    try {
      await mail.send({
        to: user.email,
        subject,
        text,
        html,
      });
    } catch (err: unknown) {
      this.logger.error(
        `Welcome invitation email failed for ${user.email}`,
        err instanceof Error ? err.stack : String(err),
      );
      throw new ServiceUnavailableException('Email delivery failed');
    }
  }

  private buildWelcomeEmail(
    locale: SupportedPasswordResetLocale,
    plainUsername: string,
    htmlSafeUsername: string,
    link: string,
    href: string,
  ): { subject: string; text: string; html: string } {
    if (locale === 'fr') {
      return {
        subject: 'Bienvenue sur BugBountyApp — activez votre compte',
        text: [
          `Bonjour ${plainUsername},`,
          '',
          'Un compte BugBountyApp a été créé pour vous.',
          'Pour vous connecter, définissez votre mot de passe via le lien ci-dessous (valide un temps limité) :',
          '',
          link,
        ].join('\n'),
        html: `<p>Bonjour ${htmlSafeUsername},</p><p>Un compte BugBountyApp a été créé pour vous.</p><p><a href="${href}">Définir mon mot de passe</a></p>`,
      };
    }
    return {
      subject: 'Welcome to BugBountyApp — activate your account',
      text: [
        `Hello ${plainUsername},`,
        '',
        'A BugBountyApp account has been created for you.',
        'To sign in, set your password using the link below (valid for a limited time):',
        '',
        link,
      ].join('\n'),
      html: `<p>Hello ${htmlSafeUsername},</p><p>A BugBountyApp account has been created for you.</p><p><a href="${href}">Set my password</a></p>`,
    };
  }
}
