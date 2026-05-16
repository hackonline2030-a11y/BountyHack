const AUTH_TYPE_PASSPORT_JWT = 'PASSPORT_JWT';

function normalizeEnvValue(value?: string): string {
  return value?.trim().toUpperCase() ?? '';
}

export function getAuthType(): string {
  const value = normalizeEnvValue(process.env.AUTH_TYPE);
  return value || AUTH_TYPE_PASSPORT_JWT;
}

/** Cookie name for opaque refresh (`httpOnly`). */
export function getJwtRefreshCookieName(): string {
  const name = process.env.JWT_REFRESH_COOKIE_NAME?.trim();
  return name && name.length > 0 ? name : 'refresh_token';
}
