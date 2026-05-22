/**
 * BFF rate limiting is off in development/test unless forced.
 * Override: BFF_RATE_LIMIT_DISABLED=1 | BFF_RATE_LIMIT_FORCE=1
 */
export function isBffRateLimitEnabled(): boolean {
  if (process.env.BFF_RATE_LIMIT_FORCE === '1') {
    return true;
  }
  if (process.env.BFF_RATE_LIMIT_DISABLED === '1') {
    return false;
  }
  const env = (process.env.NODE_ENV ?? '').trim().toLowerCase();
  if (env === 'development' || env === 'test') {
    return false;
  }
  return true;
}
