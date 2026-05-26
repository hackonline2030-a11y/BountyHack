/** TTL for account-setup / invitation tokens (`ACCOUNT_SETUP_TOKEN_TTL`). Default `48h`. */
export function accountSetupTokenExpiresAt(nowMs = Date.now()): Date {
  const env = process.env.ACCOUNT_SETUP_TOKEN_TTL?.trim() || '48h';
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
  return new Date(nowMs + 48 * 3600000);
}
