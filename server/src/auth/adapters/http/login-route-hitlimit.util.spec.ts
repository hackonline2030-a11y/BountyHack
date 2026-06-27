import type { Request } from 'express';
import {
  extractLoginTotpCode,
  loginRouteHitLimitKey,
} from './login-route-hitlimit.util';

function reqWith(body: Record<string, unknown>, ip = '203.0.113.10'): Request {
  return { body, ip } as Request;
}

describe('loginRouteHitLimitKey', () => {
  it('uses password bucket when code is absent', () => {
    expect(
      loginRouteHitLimitKey(reqWith({ email: 'a@b.co', password: 'x' })),
    ).toBe('203.0.113.10:login:password');
  });

  it('uses password bucket when code is not 6–8 digits', () => {
    expect(
      loginRouteHitLimitKey(reqWith({ email: 'a@b.co', password: 'x', code: 'abc' })),
    ).toBe('203.0.113.10:login:password');
  });

  it('uses totp bucket when code is valid shape', () => {
    expect(
      loginRouteHitLimitKey(
        reqWith({ email: 'a@b.co', password: 'x', code: '123456' }),
      ),
    ).toBe('203.0.113.10:login:totp');
  });

  it('normalizes whitespace in code before bucket selection', () => {
    expect(extractLoginTotpCode(reqWith({ code: '12 34 56' }))).toBe('123456');
    expect(
      loginRouteHitLimitKey(reqWith({ code: '12 34 56' })),
    ).toBe('203.0.113.10:login:totp');
  });
});
