/** Must match `supportedLngs` first segment in `i18n.config.ts`. */
const LOCALE_PREFIX = /^\/(en|fr)(?=\/|$)/;

export function localePrefixFromPathname(pathname: string): string {
  return pathname.match(LOCALE_PREFIX)?.[0] ?? "/en";
}

export function isAuthLoginPath(pathname: string): boolean {
  return /^\/(en|fr)\/login$/.test(pathname);
}

export function isAuthRegisterPath(pathname: string): boolean {
  return /^\/(en|fr)\/register$/.test(pathname);
}
