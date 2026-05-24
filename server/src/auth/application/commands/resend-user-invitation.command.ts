import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common';
import { isPrismaSqlMode } from '../../../shared/database-mode';
import { deriveUserAccountStatus } from '../../../users/models/user-account-status';
import {
  I_USER_REPOSITORY,
  IUserRepository,
} from '../../../users/ports/user-repository.interface';
import { buildWelcomeInvitationEmail } from '../../adapters/transactional-mail/welcome-invitation-mail.util';
import {
  normalizeAccountSetupLocale,
  type SupportedPasswordResetLocale,
} from '../../config/account-setup-public-url';
import type { ITransactionalMailPort } from '../../ports/transactional-mail.port';
import { TRANSACTIONAL_MAIL_PORT } from '../../ports/transactional-mail.port';
import { IssuePasswordSetupTokenService } from '../services/issue-password-setup-token.service';

export type ResendUserInvitationInput = {
  userId: string;
  locale?: string;
};

@Injectable()
export class ResendUserInvitationCommand {
  private readonly logger = new Logger(ResendUserInvitationCommand.name);

  constructor(
    @Inject(I_USER_REPOSITORY)
    private readonly users: IUserRepository,
    @Optional()
    private readonly issueSetupToken: IssuePasswordSetupTokenService | null,
    @Optional()
    @Inject(TRANSACTIONAL_MAIL_PORT)
    private readonly mail: ITransactionalMailPort | null,
  ) {}

  async execute(input: ResendUserInvitationInput): Promise<{ ok: true }> {
    if (!isPrismaSqlMode() || !this.issueSetupToken || !this.mail) {
      throw new BadRequestException(
        'Resend invitation requires POSTGRESQL_PRISMA or MYSQL_PRISMA and mail configuration',
      );
    }

    const activation = await this.users.findAdminActivationById(input.userId.trim());
    if (!activation) {
      throw new NotFoundException('User not found');
    }
    if (activation.hasPasswordHash) {
      throw new BadRequestException('User already has a password');
    }
    if (!activation.email) {
      throw new BadRequestException('User has no email address');
    }

    const status = deriveUserAccountStatus(
      activation.hasPasswordHash,
      activation.latestTokenExpiresAt,
    );
    if (status !== 'unvalid') {
      throw new BadRequestException(
        'Invitation can only be resent when the previous link is expired (unvalid status)',
      );
    }

    const locale = normalizeAccountSetupLocale(input.locale) as SupportedPasswordResetLocale;
    const { link } = await this.issueSetupToken.issueForUser(activation.userId, locale);
    const { subject, text, html } = buildWelcomeInvitationEmail(
      locale,
      activation.username,
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
        `Resend invitation email failed for ${activation.email}`,
        err instanceof Error ? err.stack : String(err),
      );
      throw new ServiceUnavailableException('Email delivery failed');
    }

    return { ok: true };
  }
}
