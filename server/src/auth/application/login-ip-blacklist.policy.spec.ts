import { UnauthorizedException } from '@nestjs/common';
import { LoginTotpChallengeRequiredError } from './errors/login-totp-challenge-required.error';
import { shouldBlacklistIpOnLoginFailure } from './login-ip-blacklist.policy';

describe('shouldBlacklistIpOnLoginFailure', () => {
  it('does not blacklist on TOTP challenge (step 1 with 2FA)', () => {
    expect(
      shouldBlacklistIpOnLoginFailure(new LoginTotpChallengeRequiredError()),
    ).toBe(false);
  });

  it('blacklists on invalid credentials', () => {
    expect(
      shouldBlacklistIpOnLoginFailure(
        new UnauthorizedException('Invalid credentials'),
      ),
    ).toBe(true);
  });

  it('blacklists on invalid TOTP code (step 2 with 2FA)', () => {
    expect(
      shouldBlacklistIpOnLoginFailure(
        new UnauthorizedException('Invalid TOTP code'),
      ),
    ).toBe(true);
  });

  it('blacklists on missing credentials', () => {
    expect(
      shouldBlacklistIpOnLoginFailure(
        new UnauthorizedException('Missing credentials'),
      ),
    ).toBe(true);
  });

  it('does not blacklist on non-unauthorized errors', () => {
    expect(shouldBlacklistIpOnLoginFailure(new Error('other'))).toBe(false);
  });
});
