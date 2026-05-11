import type { Response } from 'express';
import { variables } from '../../../shared/variables.config';
import { getJwtRefreshCookieName } from '../../config/auth-env';
import { refreshCookieMaxAgeMs } from '../utils/opaque-refresh-token.util';

/** All path variants that might hold the refresh cookie (current + legacy) — use when clearing cookies. */
export function getJwtRefreshCookiePathsForClear(): string[] {
  const segment = variables.globalPrefix.replace(/^\/+|\/+$/g, '') || 'api';
  const prefix = `/${segment}/auth`;
  return [prefix, `${prefix}/refresh`];
}

/** Browser cookie path: parent `/auth` so the same cookie is sent to `POST …/logout` as well as `POST …/refresh`. */
export function getJwtRefreshCookiePath(): string {
  const segment = variables.globalPrefix.replace(/^\/+|\/+$/g, '') || 'api';
  return `/${segment}/auth`;
}

export function clearHttpOnlyRefreshCookies(res: Response): void {
  const isProd = process.env.NODE_ENV === 'production';
  const name = getJwtRefreshCookieName();
  const base = { httpOnly: true, secure: isProd, sameSite: 'lax' as const };
  for (const path of getJwtRefreshCookiePathsForClear()) {
    res.clearCookie(name, { ...base, path });
  }
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
