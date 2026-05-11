# Next.js client: routes and backend `GET` wiring

This note lists **what shows in the browser** (pages and Next API routes) and **how server-only code calls Nest**, especially `GET /users/me`.

## App pages (App Router)

All user-facing pages live under the dynamic segment **`[lng]`** (supported locales from auth/locale policy).

| Path | Purpose |
|------|--------|
| `/{lng}` | Home |
| `/{lng}/login` | Login (public) |
| `/{lng}/forgot-password` | Forgot password — `POST …/auth/password-reset/request` (Nest direct from browser; neutral success copy) |
| `/{lng}/password-reset` | Set new password from e-mail link (`?token=…`) — `POST …/auth/password-reset/confirm` |
| `/{lng}/administration/register` | **Admin:** register a new user via Nest; **`verifySessionForRoles(lng, [AppRoleCode.SUPER_ADMIN])`**; others → redirect **`welcome-dashboard`** (see [`lib/dal/session.ts`](lib/dal/session.ts)) |
| `/{lng}/welcome-dashboard` | User welcome (session required) |
| `/{lng}/welcome` | Welcome-style page under `(admin)` (session required) |
| `/{lng}/parameters` | Settings (session required); **Security** includes TOTP enrollment UI |

Example: `http://localhost:3001/fr/welcome-dashboard`.

**E2E (Playwright):** from `bugbountyapp/client`, run `pnpm exec playwright install chromium` once, then `pnpm run test:e2e` (starts `pnpm run dev` on port 3001 unless already running). Specs live in [`e2e/`](e2e/).

## Session protection (how it works)

There is **no separate route middleware** file for “logged-in only” pages. Protection is **explicit in code**, in two shapes:

### 1. Protected **pages** (Server Components)

**Same pattern for every authenticated page** (welcome, parameters, **`/administration/register`**, and future admin/user routes):

1. **Session gate** in the page Server Component: most routes use **`await verifySession(lng)`** — [`verifySession`](lib/dal/session.ts) (cached): **`requireAppSessionUseCase`**, **`bb_access`** httpOnly cookie, **`JWT_SECRET`**. On failure: **`redirect(/${lng}/login)`**. Routes that need RBAC use **`verifySessionForRoles(lng, allowedRoles[, options])`** in the same file (calls **`verifySession`** then **`GET …/users/me`** and compares **`roleCode`**; **`forbiddenRelative`** defaults to **`welcome-dashboard`**).
2. **`await …Dal…(lng)`** — server-only helpers that read the cookie and **`fetch`** Nest (e.g. [`getWelcomeDashboardUser`](lib/dal/welcome-user.ts) for `GET …/users/me`). DAL helpers **do not** replace the page’s session gate; the page owns the gate so protected screens stay consistent.

| Route | After session gate |
|-------|------------------------|
| `/{lng}/welcome-dashboard` | [`getWelcomeDashboardUser(lng)`](lib/dal/welcome-user.ts) → Nest `users/me` |
| `/{lng}/parameters` | [`getParametersProfile(lng)`](lib/dal/parameters-profile.ts) loads `twoFactorEnabled` from `GET …/users/me`; TOTP actions use BFF `POST /api/account/...` |
| `/{lng}/administration/register` | [`RegisterForm`](app/_components/forms/RegisterForm.tsx); **`verifySessionForRoles(lng, [AppRoleCode.SUPER_ADMIN])`** |

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
- On success, client calls `POST /api/session` to persist `bb_access` httpOnly cookie and navigates to `/{lng}/welcome-dashboard`.

## Password reset (Nest direct)

- **Request link:** `POST …/auth/password-reset/request` with JSON `{ "email", "locale" }` — implemented in [`modules/auth`](modules/auth) (gateway → use case); UI: [`ForgotPasswordForm`](modules/auth/nextjs/components/forms/ForgotPasswordForm.tsx) on `/{lng}/forgot-password`. Success is always the same neutral message (anti-enumeration); errors use Nest body parsing via [`messageFromNestBody`](lib/auth-api.ts).
- **Confirm:** `POST …/auth/password-reset/confirm` with `{ "token", "password" }` — [`ResetPasswordForm`](modules/auth/nextjs/components/forms/ResetPasswordForm.tsx) on `/{lng}/password-reset?token=…`. On success, redirect to `/{lng}/login?passwordReset=success` (banner then URL is cleaned client-side).

## Nest calls from the server (“GET system” / `users/me`)

Some data is loaded **only on the Next.js server** during Server Component render or DAL helpers. That uses `fetch()` inside Node, not in the browser.

- **URL builder:** [`lib/server/nest-internal-url.ts`](lib/server/nest-internal-url.ts) — `nestInternalApiUrl(relativePath)` builds an absolute URL:

  `NEXT_PUBLIC_AUTH_API` + `NEXT_PUBLIC_AUTH_API_PREFIX` (default `api`) + path, e.g. `http://localhost:3000/api/users/me` for `relativePath` `"users/me"`.

- **Welcome profile:** [`lib/dal/welcome-user.ts`](lib/dal/welcome-user.ts) — `getWelcomeDashboardUser(lng)` (`"server-only"`); **called only after** `verifySession(lng)` on the page:

  1. Reads the access token from the **httpOnly** cookie.
  2. **`GET`** `nestInternalApiUrl("users/me")` with `Authorization: Bearer <token>`, `cache: "no-store"`.
  3. Maps the JSON `username` field to UI data; no JWT/email fallback. On failure or missing username, logs **`Aucun pseudo trouvé`** and the UI shows only the plain “Bienvenue” / “Welcome” heading.

**Why DevTools does not show this `GET`:** the request is made **from the Next server to Nest**, while the browser only requests the document (e.g. `GET /fr/welcome-dashboard`). To observe the Nest call, use Nest’s request logs or tooling on the server process—not the browser Network panel (unless you deliberately move the fetch to the client, which has different security implications).

## Related env vars

| Variable | Role |
|----------|------|
| `NEXT_PUBLIC_AUTH_API` | Base URL of the Nest app (required for `nestInternalApiUrl`). |
| `NEXT_PUBLIC_AUTH_API_PREFIX` | Global API prefix (optional; default `api`). |
