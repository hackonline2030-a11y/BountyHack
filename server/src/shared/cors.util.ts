/**
 * Default browser origins: production front (Vercel) + Next.js local dev on :3001 (see `client/`).
 * Port 3000 is reserved for the Nest API process (`PORT` in server/.env, incl. in Docker on container :3000);
 * the Next app uses 3001 by convention (`pnpm dev` in client is `next dev -p 3001`).
 * Override with CORS_ORIGIN in .env; use "*" for dev only (not recommended in production).
 */
export const DEFAULT_CORS_ORIGIN =
  'https://bugbountyapp.vercel.app,http://localhost:3001';

export function getCorsEnvRaw(): string {
  return (process.env.CORS_ORIGIN ?? DEFAULT_CORS_ORIGIN).trim();
}

export function isCorsOpenToAll(): boolean {
  const raw = getCorsEnvRaw();
  return raw === '' || raw === '*';
}

/** Nest `enableCors` (HTTP). */
export function getHttpCorsOrigin(): string | string[] {
  if (isCorsOpenToAll()) {
    return '*';
  }
  return getCorsEnvRaw()
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}
