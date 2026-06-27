import { UnauthorizedException } from '@nestjs/common';

/** Password verified; client must submit TOTP — not a login security failure for IP blacklist. */
export class LoginTotpChallengeRequiredError extends UnauthorizedException {
  constructor() {
    super('TOTP code required');
  }
}
