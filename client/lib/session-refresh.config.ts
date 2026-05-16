/**
 * Intervalle du keep-alive session (client). À garder **strictement inférieur** à la durée
 * du JWT d'accès Nest (`JWT_EXPIRES_IN` dans `server/.env`, ex. `15m`).
 */

const DEFAULT_SESSION_REFRESH_INTERVAL_MS = 12 * 60 * 1000;
const MIN_SESSION_REFRESH_INTERVAL_MS = 60 * 1000;
const MAX_SESSION_REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;

const DURATION_SUFFIX_MS: Record<string, number> = {
  ms: 1,
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

/**
 * Parses `12m`, `720000`, etc. Returns `null` when invalid or empty.
 */
export function parseSessionRefreshIntervalMs(
  raw: string | undefined,
): number | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;

  if (/^\d+$/.test(trimmed)) {
    const ms = Number(trimmed);
    return Number.isFinite(ms) && ms > 0 ? ms : null;
  }

  const match = /^(\d+)(ms|s|m|h|d)$/i.exec(trimmed);
  if (!match) return null;

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multiplier = DURATION_SUFFIX_MS[unit];
  if (!Number.isFinite(amount) || amount <= 0 || multiplier === undefined) {
    return null;
  }

  return amount * multiplier;
}

function clampIntervalMs(ms: number): number {
  return Math.min(
    MAX_SESSION_REFRESH_INTERVAL_MS,
    Math.max(MIN_SESSION_REFRESH_INTERVAL_MS, ms),
  );
}

/**
 * Resolved keep-alive period for {@link refreshAppSession} / `SessionKeepAlive`.
 *
 * Precedence:
 * 1. `NEXT_PUBLIC_SESSION_REFRESH_INTERVAL_MS` (integer, milliseconds)
 * 2. `NEXT_PUBLIC_SESSION_REFRESH_INTERVAL` (duration, e.g. `12m` — same style as `JWT_EXPIRES_IN`)
 * 3. Default `12m`
 */
export function getSessionRefreshIntervalMs(): number {
  const fromMs = parseSessionRefreshIntervalMs(
    process.env.NEXT_PUBLIC_SESSION_REFRESH_INTERVAL_MS,
  );
  if (fromMs !== null) {
    return clampIntervalMs(fromMs);
  }

  const fromDuration = parseSessionRefreshIntervalMs(
    process.env.NEXT_PUBLIC_SESSION_REFRESH_INTERVAL,
  );
  if (fromDuration !== null) {
    return clampIntervalMs(fromDuration);
  }

  return DEFAULT_SESSION_REFRESH_INTERVAL_MS;
}
