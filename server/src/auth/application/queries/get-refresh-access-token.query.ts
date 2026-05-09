import { Inject, Injectable } from '@nestjs/common';
import type { AuthenticatedSession } from '../models/authenticated-session';
import { AuthRepository } from '../../ports/auth.repository';

/** Refresh flow: delegates to {@link AuthRepository} (dependency inversion). */
@Injectable()
export class RefreshAccessTokenQuery {
  constructor(
    @Inject(AuthRepository) private readonly authRepository: AuthRepository,
  ) {}

  execute(refreshToken: string): Promise<AuthenticatedSession> {
    return this.authRepository.refreshAccessToken(refreshToken);
  }
}
