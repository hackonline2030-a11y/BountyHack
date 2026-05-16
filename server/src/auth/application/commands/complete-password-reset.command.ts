import { Inject, Injectable } from '@nestjs/common';
import { hashPassword } from '../../adapters/utils/password.util';
import type { IPasswordResetRepository } from '../../ports/password-reset.repository';
import { PASSWORD_RESET_REPOSITORY } from '../../ports/password-reset.repository';

export type CompletePasswordResetInput = {
  token: string;
  password: string;
};

/** Applique un nouveau mot de passe après validation du jeton opaque (et révoque les refresh persistés). */
@Injectable()
export class CompletePasswordResetCommand {
  constructor(
    @Inject(PASSWORD_RESET_REPOSITORY)
    private readonly passwordReset: IPasswordResetRepository,
  ) {}

  async execute(input: CompletePasswordResetInput): Promise<void> {
    const passwordHash = await hashPassword(input.password.trim());
    await this.passwordReset.consumePendingTokenAndApplyNewPassword(
      input.token.trim(),
      passwordHash,
    );
  }
}
