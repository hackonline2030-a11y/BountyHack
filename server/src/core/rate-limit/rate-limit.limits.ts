function positiveInt(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** Per-route limits; login reads `RATE_LIMIT_LOGIN` / `RATE_LIMIT_LOGIN_WINDOW` from `.env`. */
export const routeHitLimits = {
  login: {
    limit: positiveInt(process.env.RATE_LIMIT_LOGIN, 5),
    window: process.env.RATE_LIMIT_LOGIN_WINDOW?.trim() || '15m',
  },

  refresh: {
    limit: 30,
    window: '15m',
  },

  passwordResetRequest: {
    limit: 3,
    window: '1h',
  },

  passwordResetConfirm: {
    limit: 10,
    window: '15m',
  },

  profileVerifyPassword: {
    limit: 10,
    window: '15m',
  },

  accountVerifyPassword: {
    limit: 5,
    window: '15m',
  },
} as const;
