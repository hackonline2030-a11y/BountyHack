import {
  clientPublicBaseUrl,
  normalizePasswordResetLocale,
  type SupportedPasswordResetLocale,
} from './password-reset-public-url';

export function buildAccountSetupLink(
  baseUrl: string,
  locale: SupportedPasswordResetLocale,
  rawToken: string,
): string {
  const root = baseUrl.replace(/\/+$/, '');
  const enc = encodeURIComponent(rawToken);
  return `${root}/${locale}/password-reset?token=${enc}&flow=setup`;
}

export function normalizeAccountSetupLocale(
  value: string | undefined,
): SupportedPasswordResetLocale {
  return normalizePasswordResetLocale(value);
}

export { clientPublicBaseUrl };
export type { SupportedPasswordResetLocale } from './password-reset-public-url';
