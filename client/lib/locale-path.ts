/** Must match `supportedLngs` first segment in `i18n.config.ts`. */
const LOCALE_PREFIX = /^\/(en|fr)(?=\/|$)/;

export function localePrefixFromPathname(pathname: string): string {
  return pathname.match(LOCALE_PREFIX)?.[0] ?? "/en";
}

export function isAuthLoginPath(pathname: string): boolean {
  return /^\/(en|fr)\/?$/.test(pathname);
}

/** Highlight header « Login » on login and password-reset flows (same nav group). */
export function isAuthHeaderLoginHighlightPath(pathname: string): boolean {
  return /^\/(en|fr)(\/(password-reset)|\/?)?$/.test(pathname);
}

export function isPasswordResetPath(pathname: string): boolean {
  return /^\/(en|fr)\/password-reset$/.test(pathname);
}

/** Super-admin registers new users at `/{lng}/administration/register` (session + `SUPER_ADMIN` only). */
export function isAdministrationRegisterPath(pathname: string): boolean {
  return /^\/(en|fr)\/administration\/register$/.test(pathname);
}

/**
 * Matches any admin surface under `/{lng}/administration` — currently the
 * user-management table (`/administration`) and the register form
 * (`/administration/register`). Used by the header to keep the “Admin”
 * link highlighted while the user navigates inside the section.
 */
export function isAdministrationPath(pathname: string): boolean {
  return /^\/(en|fr)\/administration(?:\/.*)?$/.test(pathname);
}
