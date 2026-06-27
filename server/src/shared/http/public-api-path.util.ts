import type { Request } from 'express';

/** Health and OpenAPI routes excluded from IP access and rate-limit guards. */
export function isPublicApiPath(req: Request): boolean {
  const path = (req.path || req.url || '').split('?')[0];
  return path.endsWith('/ping') || path.includes('/docs');
}
