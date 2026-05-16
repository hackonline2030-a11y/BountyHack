/**
 * Paramètres TOTP alignés sur `generateURI` / Google Authenticator
 * (voir https://otplib.yeojz.dev/guide/getting-started.html).
 */
export const TOTP_CONFIG = {
  algorithm: 'sha1' as const,
  digits: 6 as const,
  period: 30,
  epochToleranceSeconds:
    Number(process.env.TOTP_EPOCH_TOLERANCE?.trim()) || 30,
};
