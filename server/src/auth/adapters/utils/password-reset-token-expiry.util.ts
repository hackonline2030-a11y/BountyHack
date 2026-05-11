/** TTL for password-reset opaque tokens (`PASSWORD_RESET_TOKEN_TTL`, e.g. `15m`, `1h`). Default `15m`. */
export function passwordResetTokenExpiresAt(nowMs = Date.now()): Date {
  const env = process.env.PASSWORD_RESET_TOKEN_TTL?.trim() || '15m';
  const suffixed = /^(\d+)\s*([dhms])$/i.exec(env);
  if (suffixed) {
    const n = Number(suffixed[1]);
    const unit = suffixed[2].toLowerCase();
    const ms =
      unit === 'd'
        ? n * 86400000
        : unit === 'h'
          ? n * 3600000
          : unit === 'm'
            ? n * 60000
            : n * 1000;
    return new Date(nowMs + ms);
  }
  const daysOnly = /^(\d+)\s*d$/i.exec(env);
  if (daysOnly) {
    return new Date(nowMs + Number(daysOnly[1]) * 86400000);
  }
  return new Date(nowMs + 15 * 60000);
}
