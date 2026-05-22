/**
 * Rate limiting is off in development/test unless forced.
 * Override: RATE_LIMIT_DISABLED=1 | RATE_LIMIT_FORCE=1
 */
export function isRateLimitEnabled(): boolean {
  if (process.env.RATE_LIMIT_FORCE === '1') {
    return true;
  }
  if (process.env.RATE_LIMIT_DISABLED === '1') {
    return false;
  }
  const env = (process.env.NODE_ENV ?? '').trim().toLowerCase();
  if (env === 'development' || env === 'test') {
    return false;
  }
  return true;
}
