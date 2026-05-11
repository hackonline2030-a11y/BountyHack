/** Must match `supportedLngs` first segment in `i18n.config.ts`. */
const LOCALE_PREFIX = /^\/(en|fr)(?=\/|$)/;

export function localePrefixFromPathname(pathname: string): string {
  return pathname.match(LOCALE_PREFIX)?.[0] ?? "/en";
}

export function isAuthLoginPath(pathname: string): boolean {
  return /^\/(en|fr)\/login$/.test(pathname);
}

/** User settings at `/{lng}/parameters` (session gated on the page). */
export function isParametersPath(pathname: string): boolean {
  return /^\/(en|fr)\/parameters$/.test(pathname);
}

/** Super-admin registers new users at `/{lng}/administration/register` (session + `SUPER_ADMIN` only). */
export function isAdministrationRegisterPath(pathname: string): boolean {
  return /^\/(en|fr)\/administration\/register$/.test(pathname);
}
