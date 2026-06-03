# Next.js client: routes and backend `GET` wiring

This note lists **what shows in the browser** (pages and Next API routes) and **how server-only code calls Nest**, especially `GET /users/me`.

## App pages (App Router)

All user-facing pages live under the dynamic segment **`[lng]`** (supported locales from auth/locale policy).

| Path | Purpose |
|------|--------|
| `/{lng}` | Home |
| `/{lng}/login` | Login (public) |
| `/{lng}/password-reset` | Set new password from super-admin e-mail link (`?token=…`, optional `?flow=setup` for invitation) — `POST …/auth/password-reset/confirm` |
| `/{lng}/administration` | **Admin:** user-management table (username / email / roleCode) backed by Nest `GET …/users`; **`verifySessionForRoles(lng, [AppRoleCode.SUPER_ADMIN])`**; others → **`notFound()`** (404) |
| `/{lng}/administration/register` | **Admin:** register a new user via Nest; **`verifySessionForRoles(lng, [AppRoleCode.SUPER_ADMIN])`**; others → **`notFound()`** (404) (see [`lib/dal/session.ts`](lib/dal/session.ts)). Successful submit redirects back to `/{lng}/administration` and refreshes the table. |
| `/{lng}/welcome-hunter` | Hunter welcome dashboard under `(hunter)`; **`verifySessionForRoles(lng, [AppRoleCode.HUNTER])`**; others → **`notFound()`** (404) |
| `/{lng}/welcome-admin` | Admin welcome page under `(admin)`; **`verifySessionForRoles(lng, [AppRoleCode.SUPER_ADMIN])`**; others → **`notFound()`** (404) |
| `/{lng}/parameters` | Settings (session required); **Security** includes TOTP enrollment UI |

Example: `http://localhost:3001/fr/welcome-hunter`.

**E2E (Playwright):** from `bugbountyapp/client`, run `pnpm exec playwright install chromium` once, then `pnpm run test:e2e` (starts `pnpm run dev` on port 3001 unless already running). Specs live in [`e2e/`](e2e/).

## Session protection (how it works)

There is **no separate route middleware** file for “logged-in only” pages. Protection is **explicit in code**, in two shapes:

### 1. Protected **pages** (Server Components)

**Same pattern for every authenticated page** (welcome, parameters, **`/administration/register`**, and future admin/user routes):

1. **Session gate** in the page Server Component: most routes use **`await verifySession(lng)`** — [`verifySession`](lib/dal/session.ts) (cached): **`requireAppSessionUseCase`**, **`bb_access`** httpOnly cookie, **`JWT_SECRET`**. On failure: **`redirect(/${lng}/login)`**. Routes that need RBAC use **`verifySessionForRoles(lng, allowedRoles)`** in the same file (calls **`verifySession`** then **`GET …/users/me`** and compares **`roleCode`**). When `roleCode` is not in `allowedRoles`, the helper calls **`notFound()`** from `next/navigation` (renders a 404). The 404 is chosen over a 403 on purpose: it does not disclose that the route exists, so a probing hunter sees the same response on `/welcome-admin` as on `/random-typo` — and it relies only on stable Next.js APIs (no experimental flag).
2. **`await …Dal…(lng)`** — server-only helpers that read the cookie and **`fetch`** Nest (e.g. [`getWelcomeUser`](lib/dal/welcome-user.ts) for `GET …/users/me`). DAL helpers **do not** replace the page’s session gate; the page owns the gate so protected screens stay consistent.

| Route | After session gate |
|-------|------------------------|
| `/{lng}/welcome-hunter` | [`getWelcomeUser(lng)`](lib/dal/welcome-user.ts); **`verifySessionForRoles(lng, [AppRoleCode.HUNTER])`** |
| `/{lng}/welcome-admin` | [`getWelcomeUser(lng)`](lib/dal/welcome-user.ts); **`verifySessionForRoles(lng, [AppRoleCode.SUPER_ADMIN])`** |
| `/{lng}/parameters` | [`getParametersProfile(lng)`](lib/dal/parameters-profile.ts) loads `twoFactorEnabled` from `GET …/users/me`; TOTP actions use BFF `POST /api/account/...` |
| `/{lng}/administration` | [`listAdminUsers(lng)`](lib/dal/admin-users.ts) calls Nest `GET …/users` (admin-only) and feeds [`UserManagementTable`](modules/admin/nextjs/components/UserManagementTable.tsx); **`verifySessionForRoles(lng, [AppRoleCode.SUPER_ADMIN])`** |
| `/{lng}/administration/register` | [`RegisterForm`](modules/auth/nextjs/components/forms/RegisterForm.tsx); **`verifySessionForRoles(lng, [AppRoleCode.SUPER_ADMIN])`**. On success: `router.replace('/{lng}/administration')` then `router.refresh()`. |

So “session protected” here means: **valid JWT in the Next origin cookie**, verified server-side before HTML for that route.

### 2. Protected **API routes** (BFF / TOTP)

| Route | Mechanism |
|-------|-----------|
| `POST /api/account/totp/enable/start` | **[`bearerTokenFromSessionOrUnauthorized()`](lib/server/bearer-from-session.ts)** — same **`requireAppSessionUseCase`** as `verifySession`. On failure: **`401` JSON** (no redirect), because the caller is `fetch()` from the page, not a full document navigation. |
| `POST /api/account/totp/enable/confirm` | Same. |
| `POST /api/account/totp/disable` | Same. Requires `{ code }` (6–8 digits) and proxies Nest step-up disable. |
| `GET /api/session/status` | Same session guard, then optional `GET …/users/me`; returns `{ authenticated, username, roleCode }` for header client UI. |

**`POST /api/session`** creates the session (sets the cookie after login/register). **`DELETE /api/session`** clears only the **Next** access cookie — pair it with **`POST …/auth/logout`** on Nest (browser, `credentials: 'include'`) so the **opaque refresh** is revoked server-side.

### Summary

- **Pages:** redirect unauthenticated users to `/{lng}/login`.
- **Session API helpers:** same verifier; **API** returns **401** instead of redirect.
- The **JWT never leaves the server** in responses to the browser for these flows; only the **httpOnly** cookie round-trips.

## Next.js API routes (`app/api`)

| Method & path | Purpose |
|---------------|--------|
| `POST /api/session` | Store the Nest access JWT as an **httpOnly** cookie on the Next origin (used after login/register from the client). |
| `DELETE /api/session` | **`destroyAppSessionUseCase`** clears the **Next** `bb_access` cookie. Header **Log out** runs **`performBrowserLogoutUseCase`** (Nest `postAuthLogout` then this route). |
| `POST /api/account/register-user` | **BFF:** `POST …/auth/register` with Bearer — Nest allows only **`SUPER_ADMIN`**; [`RegisterForm`](app/_components/forms/RegisterForm.tsx) uses this (httpOnly JWT cannot be sent from browser JS directly). |
| `POST /api/account/totp/enable/start` | **BFF:** forwards to Nest `POST …/auth/totp/enable/start` using the **verified** session cookie JWT (never exposed to client JS). |
| `POST /api/account/totp/enable/confirm` | **BFF:** same for `POST …/auth/totp/enable/confirm` with JSON `{ "code": "123456" }` (6–8 digits). |
| `POST /api/account/totp/disable` | **BFF:** same for `POST …/auth/totp/disable` with JSON `{ "code": "123456" }` (6–8 digits). |
| `GET /api/session/status` | **BFF:** checks Next session cookie validity and enriches client header with `username` / `roleCode` from Nest `GET …/users/me` when available. |

These are **requested by the browser** (or by client code) and therefore appear in Chrome DevTools → **Network** when triggered.

**TOTP security model:** the browser calls only the **Next origin** (`/api/account/...`). The Nest access JWT stays **httpOnly**; Next route handlers read it server-side and attach `Authorization: Bearer` to Nest—same trust boundary as [`lib/dal/welcome-user.ts`](lib/dal/welcome-user.ts), without pasting tokens in the page (contrast with the Nest EJS demo). Disable uses the same boundary and enforces a current TOTP code.

## Logout

1. Browser **`POST …/auth/logout`** on the Nest origin (`postAuthLogout()` in [`lib/auth-api.ts`](lib/auth-api.ts), `credentials: 'include'`) — revokes the persisted opaque refresh hash and clears the refresh **`httpOnly`** cookie.
2. Browser **`DELETE /api/session`** (`same-origin`) — drops the short-lived access JWT cookie on Next.
3. The access JWT remains **cryptographically valid** until **`exp`** ([stateless JWT + logout trade-offs](https://www.descope.com/blog/post/jwt-logout-risks-mitigations)); the exposure window stays short (**`JWT_EXPIRES_IN`**, e.g. 10m) and **without a valid refresh token the user cannot mint a new session**.

## Login flow (2-step when required)

- Browser submits `POST …/auth/login` with email/password.
- If account has no TOTP enabled (`two_factor_enabled = 0`): Nest returns access JWT directly (normal login).
- If account has TOTP enabled (`two_factor_enabled = 1`): Nest responds `401` (`TOTP code required`), UI switches to step 2 and resubmits login with `code`.
- On success, client calls `POST /api/session` with the raw Nest access JWT. The BFF resolves the user's `roleCode` from Nest **`GET …/users/me`** *before* setting any cookie and enforces the login-time allow-list ([`APP_LOGIN_ALLOWED_ROLES`](lib/app-role-code.ts) — currently `SUPER_ADMIN`, `HUNTER`):
  - Role allowed → cookie is persisted, response body is `{ ok: true, roleCode }`. Client routes to `/{lng}/welcome-admin` (`SUPER_ADMIN`) or `/{lng}/welcome-hunter` (`HUNTER`).
  - Role refused → **HTTP 403** with `{ error: "role_not_allowed", roleCode }`, **no cookie is set**, the user stays on `/{lng}/login` with `loginForm.errorRoleNotAllowed` visible. There is no fallback dashboard and no create-then-revoke window.
  - Nest unreachable / token rejected → standard 401/502 error path. The role-resolution helper lives in [`lib/server/fetch-role-from-nest.ts`](lib/server/fetch-role-from-nest.ts).

## Password reset (Nest direct, super-admin e-mail links only)

- **Confirm:** `POST …/auth/password-reset/confirm` with `{ "token", "password" }` — [`ResetPasswordForm`](modules/auth/nextjs/components/forms/ResetPasswordForm.tsx) on `/{lng}/password-reset?token=…` (optional `flow=setup` for first-time password). On success, redirect to `/{lng}/login?passwordReset=success` or `?accountSetup=success` (banner then URL is cleaned client-side).
- **Issue link (server only):** super-admin actions on Nest — register without password, `resend-invitation`, `force-password-reset` — send e-mails with the same `password-reset` page; no public “forgot password” form.

## Nest calls from the server (“GET system” / `users/me`)

Some data is loaded **only on the Next.js server** during Server Component render or DAL helpers. That uses `fetch()` inside Node, not in the browser.

- **URL builder:** [`lib/server/nest-internal-url.ts`](lib/server/nest-internal-url.ts) — `nestInternalApiUrl(relativePath)` builds an absolute URL:

  `NEXT_PUBLIC_AUTH_API` + `NEXT_PUBLIC_AUTH_API_PREFIX` (default `api`) + path, e.g. `http://localhost:3000/api/users/me` for `relativePath` `"users/me"`.

- **Welcome profile:** [`lib/dal/welcome-user.ts`](lib/dal/welcome-user.ts) — `getWelcomeUser(lng)` (`"server-only"`); **called only after** `verifySession(lng)` on the page:

  1. Reads the access token from the **httpOnly** cookie.
  2. **`GET`** `nestInternalApiUrl("users/me")` with `Authorization: Bearer <token>`, `cache: "no-store"`.
  3. Maps the JSON `username` field to UI data; no JWT/email fallback. On failure or missing username, logs **`Aucun pseudo trouvé`** and the UI shows only the plain “Bienvenue” / “Welcome” heading.

- **Admin user listing:** [`lib/dal/admin-users.ts`](lib/dal/admin-users.ts) — `listAdminUsers(lng)` (`"server-only"`); **called only after** `verifySessionForRoles(lng, [AppRoleCode.SUPER_ADMIN])`:

  1. Reads the access token from the **httpOnly** cookie (redirect to login if missing).
  2. **`GET`** `nestInternalApiUrl("users")` with `Authorization: Bearer <token>`, `cache: "no-store"`. The Nest endpoint is decorated with **`@AuthRoles(AppRoleCode.SUPER_ADMIN)`**, so a stolen cookie tied to a non-admin account is rejected with **403** here — independent of the Next page gate.
  3. Parses `{ items: UserAdminSummaryDto[] }` (each row: `uid`, `username`, `email`, `roleCode`) into a typed `AdminUserSummary[]`. Unknown role codes are coerced to `null` rather than rendered verbatim. Errors are returned as a discriminated union (`unreachable` / `malformed_payload`) so the page can show a localised banner instead of a stack trace.

**Why DevTools does not show this `GET`:** the request is made **from the Next server to Nest**, while the browser only requests the document (e.g. `GET /fr/welcome-hunter`). To observe the Nest call, use Nest’s request logs or tooling on the server process—not the browser Network panel (unless you deliberately move the fetch to the client, which has different security implications).

## Related env vars

| Variable | Role |
|----------|------|
| `NEXT_PUBLIC_AUTH_API` | Base URL of the Nest app (required for `nestInternalApiUrl`). |
| `NEXT_PUBLIC_AUTH_API_PREFIX` | Global API prefix (optional; default `api`). |
