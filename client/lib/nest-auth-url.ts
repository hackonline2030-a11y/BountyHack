/**
 * Absolute Nest auth URL for **browser** calls (login, password reset, refresh, logout).
 * Same rules as `lib/auth-api.ts`: `NEXT_PUBLIC_AUTH_API` + `NEXT_PUBLIC_AUTH_API_PREFIX` + `/auth` + suffix.
 */
export function nestAuthAbsoluteUrl(authPathSuffix: string): string {
  const base = (process.env.NEXT_PUBLIC_AUTH_API ?? "").replace(/\/+$/, "");
  if (!base) {
    throw new Error(
      "NEXT_PUBLIC_AUTH_API is not set (e.g. http://localhost:3000)",
    );
  }
  const prefix = (process.env.NEXT_PUBLIC_AUTH_API_PREFIX ?? "api").replace(
    /^\/+|\/+$/g,
    "",
  );
  const suffix = authPathSuffix.startsWith("/")
    ? authPathSuffix
    : `/${authPathSuffix}`;
  return `${base}/${prefix}/auth${suffix}`;
}
