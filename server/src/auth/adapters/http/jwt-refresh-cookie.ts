import type { Response } from 'express';
import { variables } from '../../../shared/variables.config';
import { getJwtRefreshCookieName } from '../../config/auth-env';
import { refreshCookieMaxAgeMs } from '../utils/opaque-refresh-token.util';

/** Browser path scoped to refresh endpoint (`Set-Cookie` Path), e.g. `/api/auth/refresh`. */
export function getJwtRefreshCookiePath(): string {
  const segment = variables.globalPrefix.replace(/^\/+|\/+$/g, '') || 'api';
  return `/${segment}/auth/refresh`;
}

export function attachHttpOnlyRefreshCookie(
  res: Response,
  rawRefreshToken: string | undefined,
): void {
  if (!rawRefreshToken?.trim()) {
    return;
  }
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie(getJwtRefreshCookieName(), rawRefreshToken.trim(), {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: getJwtRefreshCookiePath(),
    maxAge: refreshCookieMaxAgeMs(),
  });
}
