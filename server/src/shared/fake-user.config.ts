/**
 * Super-admin fake-user registration (setup link in UI, no email).
 * Enabled by default in all environments including production.
 * Set `ALLOW_FAKE_USER_REGISTRATION=0` (or `false` / `no`) in **server/.env** only to disable.
 */
export function isFakeUserRegistrationAllowed(): boolean {
  const raw = (process.env.ALLOW_FAKE_USER_REGISTRATION ?? '')
    .trim()
    .toLowerCase();
  if (raw === '0' || raw === 'false' || raw === 'no') {
    return false;
  }
  return true;
}
