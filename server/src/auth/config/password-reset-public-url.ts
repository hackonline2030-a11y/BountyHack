export type SupportedPasswordResetLocale = 'en' | 'fr';

export function clientPublicBaseUrl(): string {
  const raw = process.env.CLIENT_PUBLIC_BASE_URL?.trim();
  if (!raw) {
    return 'http://localhost:3001';
  }
  return raw.replace(/\/+$/, '');
}

export function normalizePasswordResetLocale(
  value: string | undefined,
): SupportedPasswordResetLocale {
  const v = (value ?? 'en').trim().toLowerCase();
  return v === 'fr' ? 'fr' : 'en';
}

export function buildPasswordResetLink(
  baseUrl: string,
  locale: SupportedPasswordResetLocale,
  rawToken: string,
): string {
  const root = baseUrl.replace(/\/+$/, '');
  const enc = encodeURIComponent(rawToken);
  return `${root}/${locale}/password-reset?token=${enc}`;
}
