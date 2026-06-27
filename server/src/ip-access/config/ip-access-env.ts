const DEFAULT_PREFIX = 'bb:sec:bl:';

/** Whitelist snapshot cache TTL in ms (guard hot path). Default 30s. */
export function getIpWhitelistCacheTtlMs(): number {
  const raw = process.env.IP_ACCESS_WHITELIST_CACHE_TTL_SEC?.trim();
  if (!raw) {
    return 30_000;
  }
  const seconds = Number(raw);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds * 1000 : 30_000;
}

export function getIpBlacklistRedisPrefix(): string {
  const value = process.env.IP_ACCESS_REDIS_PREFIX?.trim();
  return value && value.length > 0 ? value : DEFAULT_PREFIX;
}

/** Blacklist TTL in seconds; 0 = no expiry (persistent key). */
export function getIpBlacklistTtlSeconds(): number {
  const raw = process.env.IP_ACCESS_BLACKLIST_TTL_SECONDS?.trim();
  if (!raw) {
    return 0;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}
