import { UnauthorizedException } from '@nestjs/common';

/** Password verified; client must submit TOTP — intermediate step, not a failed login. */
export class LoginTotpChallengeRequiredError extends UnauthorizedException {
  constructor() {
    super('TOTP code required');
  }
}
