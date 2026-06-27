import type { Request } from 'express';
import { resolveClientIp } from '../../../shared/http/client-ip.util';

/** Same shape check as login repository (6–8 digits after whitespace trim). */
export function extractLoginTotpCode(req: Request): string | undefined {
  const raw =
    req.body && typeof req.body.code === 'string' ? req.body.code : '';
  const code = raw.replace(/\s/g, '');
  return /^\d{6,8}$/.test(code) ? code : undefined;
}

/**
 * Separate rate-limit buckets for password step vs TOTP step on `POST /auth/login`.
 * Lets step 1 (password OK → challenge) consume `:password` without blocking step 2 `:totp`.
 */
export function loginRouteHitLimitKey(req: Request): string {
  const ip = resolveClientIp(req);
  const phase = extractLoginTotpCode(req) ? 'totp' : 'password';
  return `${ip}:login:${phase}`;
}
