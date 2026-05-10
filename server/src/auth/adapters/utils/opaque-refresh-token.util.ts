import { randomBytes, createHash } from 'crypto';
import type { AuthenticatedSession } from '../../application/models/authenticated-session';
import type { IRefreshTokenRepository } from '../../ports/refresh-token.repository';

export function generateOpaqueRefreshRaw(): string {
  return randomBytes(32).toString('hex');
}

export function hashOpaqueRefreshRaw(rawToken: string): string {
  return createHash('sha256').update(rawToken.trim(), 'utf8').digest('hex');
}

/** Maps `JWT_REFRESH_EXPIRES_IN`-style suffix: `Nd`, `Nh`, `Nm`, `Ns`; default `30d`. */
export function opaqueRefreshExpiryDate(nowMs = Date.now()): Date {
  const env = process.env.JWT_REFRESH_EXPIRES_IN?.trim() || '30d';
  const suffixed = /^(\d+)\s*([dhms])$/i.exec(env);
  if (suffixed) {
    const n = Number(suffixed[1]);
    const unit = suffixed[2].toLowerCase();
    const ms =
      unit === 'd'
        ? n * 86400000
        : unit === 'h'
          ? n * 3600000
          : unit === 'm'
            ? n * 60000
            : n * 1000;
    return new Date(nowMs + ms);
  }
  const daysOnly = /^(\d+)\s*d$/i.exec(env);
  if (daysOnly) {
    return new Date(nowMs + Number(daysOnly[1]) * 86400000);
  }
  return new Date(nowMs + 30 * 86400000);
}

/** Max-Age semantics for Set-Cookie (milliseconds), aligned with opaque DB expiry. */
export function refreshCookieMaxAgeMs(nowMs = Date.now()): number {
  return Math.max(0, opaqueRefreshExpiryDate(nowMs).getTime() - nowMs);
}

export async function attachOpaqueRefreshToSession(
  repo: IRefreshTokenRepository,
  session: AuthenticatedSession,
): Promise<AuthenticatedSession> {
  const raw = generateOpaqueRefreshRaw();
  await repo.store(session.user.uid, raw, opaqueRefreshExpiryDate());
  return { ...session, refreshToken: raw };
}
