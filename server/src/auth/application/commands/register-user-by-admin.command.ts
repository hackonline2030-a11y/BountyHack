import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  Optional,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { isFakeUserRegistrationAllowed } from '../../../shared/fake-user.config';
import { isPrismaSqlMode } from '../../../shared/database-mode';
import type { AuthenticatedUserProfile } from '../models/authenticated-session';
import type { RegisterWithPasswordInput } from '../models/register-with-password.input';
import type { RegisterUserByAdminResult } from '../models/register-user-by-admin.result';
import { IssuePasswordSetupTokenService } from '../services/issue-password-setup-token.service';
import type { ITransactionalMailPort } from '../../ports/transactional-mail.port';
import { TRANSACTIONAL_MAIL_PORT } from '../../ports/transactional-mail.port';
import { AuthRepository } from '../../ports/auth.repository';
import { buildWelcomeInvitationEmail } from '../../adapters/transactional-mail/welcome-invitation-mail.util';
import {
  normalizeAccountSetupLocale,
  type SupportedPasswordResetLocale,
} from '../../config/account-setup-public-url';

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

    if (input.fakeUser) {
      if (!isFakeUserRegistrationAllowed()) {
        throw new ForbiddenException(
          'Fake user registration is disabled on this server (ALLOW_FAKE_USER_REGISTRATION=0 in server/.env)',
        );
      }
      if (!isPrismaSqlMode() || !this.issueSetupToken) {
        throw new BadRequestException(
          'Fake user registration requires POSTGRESQL_PRISMA or MYSQL_PRISMA',
        );
      }

      const user = await this.authRepository.registerPendingActivation({
        email,
        username,
        roleCode: input.roleCode,
        isFakeUser: true,
      });

      const locale = normalizeAccountSetupLocale(input.locale);
      const { link } = await this.issueSetupToken.issueForUser(user.uid, locale);

      return { kind: 'fakeUser', user, accountSetupLink: link };
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
    const { subject, text, html } = buildWelcomeInvitationEmail(
      locale,
      user.username,
      link,
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
}
