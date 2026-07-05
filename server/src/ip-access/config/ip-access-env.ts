/** Whitelist snapshot cache TTL in ms (guard hot path). Default 30s. */
export function getIpWhitelistCacheTtlMs(): number {
  const raw = process.env.IP_ACCESS_WHITELIST_CACHE_TTL_SEC?.trim();
  if (!raw) {
    return 30_000;
  }
  const seconds = Number(raw);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds * 1000 : 30_000;
}
