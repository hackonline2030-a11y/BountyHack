import { UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { LoginTotpChallengeRequiredError } from '../../application/errors/login-totp-challenge-required.error';
import { BlacklistClientIpCommand } from '../../../ip-access/application/commands/blacklist-client-ip.command';
import { LoginAuthFailureFilter } from './login-auth-failure.filter';

jest.mock('../../../shared/is-ip-access-enabled', () => ({
  isIpAccessEnabled: jest.fn(),
}));

import { isIpAccessEnabled } from '../../../shared/is-ip-access-enabled';

describe('LoginAuthFailureFilter', () => {
  const blacklistClientIp = { execute: jest.fn() };
  let filter: LoginAuthFailureFilter;
  let res: Response;

  beforeEach(() => {
    jest.clearAllMocks();
    filter = new LoginAuthFailureFilter(
      blacklistClientIp as unknown as BlacklistClientIpCommand,
    );
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
    (isIpAccessEnabled as jest.Mock).mockReturnValue(true);
    blacklistClientIp.execute.mockResolvedValue(undefined);
  });

  function hostFor(req: Partial<Request>) {
    return {
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => res,
      }),
    };
  }

  it('does not blacklist on TOTP challenge', async () => {
    await filter.catch(new LoginTotpChallengeRequiredError(), hostFor({
      method: 'POST',
      path: '/api/auth/login',
      ip: '203.0.113.10',
    }) as never);

    expect(blacklistClientIp.execute).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('blacklists on invalid credentials', async () => {
    await filter.catch(
      new UnauthorizedException('Invalid credentials'),
      hostFor({
        method: 'POST',
        path: '/api/auth/login',
        ip: '203.0.113.10',
      }) as never,
    );

    expect(blacklistClientIp.execute).toHaveBeenCalledWith({
      clientIp: '203.0.113.10',
      reason: 'login_failed',
    });
  });

  it('blacklists on invalid TOTP code', async () => {
    await filter.catch(
      new UnauthorizedException('Invalid TOTP code'),
      hostFor({
        method: 'POST',
        path: '/api/auth/login',
        ip: '203.0.113.11',
      }) as never,
    );

    expect(blacklistClientIp.execute).toHaveBeenCalledWith({
      clientIp: '203.0.113.11',
      reason: 'login_failed',
    });
  });

  it('does not blacklist when ip access is disabled', async () => {
    (isIpAccessEnabled as jest.Mock).mockReturnValue(false);

    await filter.catch(
      new UnauthorizedException('Invalid credentials'),
      hostFor({
        method: 'POST',
        path: '/api/auth/login',
        ip: '203.0.113.10',
      }) as never,
    );

    expect(blacklistClientIp.execute).not.toHaveBeenCalled();
  });

  it('does not blacklist on non-login routes', async () => {
    await filter.catch(
      new UnauthorizedException('Invalid credentials'),
      hostFor({
        method: 'POST',
        path: '/api/auth/refresh',
        ip: '203.0.113.10',
      }) as never,
    );

    expect(blacklistClientIp.execute).not.toHaveBeenCalled();
  });
});
