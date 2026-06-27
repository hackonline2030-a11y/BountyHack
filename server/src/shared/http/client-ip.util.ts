import type { Request } from 'express';

/** Client IP for rate limiting and IP access policy (requires `trust proxy` behind reverse proxies). */
export function resolveClientIp(req: Request): string {
  return req.ip || req.socket?.remoteAddress || 'unknown';
}
