import { Inject, Injectable } from '@nestjs/common';
import {
  generateOpaqueRefreshRaw,
  hashOpaqueRefreshRaw,
} from '../../adapters/utils/opaque-refresh-token.util';
import { accountSetupTokenExpiresAt } from '../../adapters/utils/account-setup-token-expiry.util';
import {
  buildAccountSetupLink,
  clientPublicBaseUrl,
  normalizeAccountSetupLocale,
  type SupportedPasswordResetLocale,
} from '../../config/account-setup-public-url';
import type { IPasswordResetRepository } from '../../ports/password-reset.repository';
import { PASSWORD_RESET_REPOSITORY } from '../../ports/password-reset.repository';

export type IssuedPasswordSetupToken = {
  rawToken: string;
  link: string;
  expiresAt: Date;
};

@Injectable()
export class IssuePasswordSetupTokenService {
  constructor(
    @Inject(PASSWORD_RESET_REPOSITORY)
    private readonly passwordReset: IPasswordResetRepository,
  ) {}

  async issueForUser(
    userId: string,
    locale?: string,
  ): Promise<IssuedPasswordSetupToken> {
    const rawToken = generateOpaqueRefreshRaw();
    const tokenHash = hashOpaqueRefreshRaw(rawToken);
    const expiresAt = accountSetupTokenExpiresAt();
    await this.passwordReset.savePendingResetToken(userId, tokenHash, expiresAt);

    const lng = normalizeAccountSetupLocale(locale) as SupportedPasswordResetLocale;
    const link = buildAccountSetupLink(
      clientPublicBaseUrl(),
      lng,
      rawToken,
    );

    return { rawToken, link, expiresAt };
  }
}
