function positiveInt(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function windowFromEnv(
  envKey: string,
  fallback: string,
): string {
  const value = process.env[envKey]?.trim();
  return value && value.length > 0 ? value : fallback;
}

function routeLimit(
  limitEnv: string,
  windowEnv: string,
  defaultLimit: number,
  defaultWindow: string,
): { limit: number; window: string } {
  return {
    limit: positiveInt(process.env[limitEnv], defaultLimit),
    window: windowFromEnv(windowEnv, defaultWindow),
  };
}

/** Per-route limits — all tunable via `.env` (see `.env.example`). */
export const routeHitLimits = {
  /** Reserved — login uses ip-access blacklist (TOTP 2-step incompatible with @HitLimit). */
  login: routeLimit(
    'RATE_LIMIT_LOGIN',
    'RATE_LIMIT_LOGIN_WINDOW',
    1,
    '24h',
  ),

  refresh: routeLimit(
    'RATE_LIMIT_REFRESH',
    'RATE_LIMIT_REFRESH_WINDOW',
    30,
    '15m',
  ),

  passwordResetConfirm: routeLimit(
    'RATE_LIMIT_PASSWORD_RESET_CONFIRM',
    'RATE_LIMIT_PASSWORD_RESET_CONFIRM_WINDOW',
    10,
    '15m',
  ),

  profileVerifyPassword: routeLimit(
    'RATE_LIMIT_PROFILE_VERIFY_PASSWORD',
    'RATE_LIMIT_PROFILE_VERIFY_PASSWORD_WINDOW',
    10,
    '15m',
  ),

  accountVerifyPassword: routeLimit(
    'RATE_LIMIT_ACCOUNT_VERIFY_PASSWORD',
    'RATE_LIMIT_ACCOUNT_VERIFY_PASSWORD_WINDOW',
    5,
    '15m',
  ),
} as const;
