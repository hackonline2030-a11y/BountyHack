/**
 * IP access policy (blacklist / whitelist) is off in development/test unless forced.
 * Override: IP_ACCESS_DISABLED=1 | IP_ACCESS_FORCE=1
 */
export function isIpAccessEnabled(): boolean {
  if (process.env.IP_ACCESS_FORCE === '1') {
    return true;
  }
  if (process.env.IP_ACCESS_DISABLED === '1') {
    return false;
  }
  const env = (process.env.NODE_ENV ?? '').trim().toLowerCase();
  if (env === 'development' || env === 'test') {
    return false;
  }
  return true;
}
