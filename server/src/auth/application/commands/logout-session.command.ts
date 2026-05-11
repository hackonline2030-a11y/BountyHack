import { Inject, Injectable } from '@nestjs/common';
import {
  IRefreshTokenRepository,
  REFRESH_TOKEN_REPOSITORY,
} from '../../ports/refresh-token.repository';

@Injectable()
export class LogoutSessionCommand {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokens: IRefreshTokenRepository,
  ) {}

  /** Revokes current opaque refresh (if presented); idempotent when missing/expired token. */
  async execute(rawRefreshToken?: string | null): Promise<void> {
    const trimmed = rawRefreshToken?.trim();
    if (trimmed) {
      await this.refreshTokens.revokeByRawToken(trimmed);
    }
  }
}
