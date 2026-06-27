import { UnauthorizedException } from '@nestjs/common';
import { LoginTotpChallengeRequiredError } from './errors/login-totp-challenge-required.error';

/**
 * Whether a failed `POST /auth/login` should blacklist the client IP.
 *
 * - No TOTP: wrong password → blacklist (step 1).
 * - With TOTP: password OK but code missing → no blacklist (challenge).
 * - With TOTP: wrong code → blacklist (step 2).
 */
export function shouldBlacklistIpOnLoginFailure(exception: unknown): boolean {
  if (exception instanceof LoginTotpChallengeRequiredError) {
    return false;
  }
  return exception instanceof UnauthorizedException;
}
