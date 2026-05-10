# Next.js client: routes and backend `GET` wiring

This note lists **what shows in the browser** (pages and Next API routes) and **how server-only code calls Nest**, especially `GET /users/me`.

## App pages (App Router)

All user-facing pages live under the dynamic segment **`[lng]`** (supported locales from auth/locale policy).

| Path | Purpose |
|------|--------|
| `/{lng}` | Home |
| `/{lng}/login` | Login |
| `/{lng}/register` | Register |
| `/{lng}/welcome-dashboard` | Authenticated welcome (session required) |
| `/{lng}/parameters` | Settings (session required); **Security** includes TOTP enrollment UI |

Example: `http://localhost:3001/fr/welcome-dashboard`.

## Next.js API routes (`app/api`)

| Method & path | Purpose |
|---------------|--------|
| `POST /api/session` | Store the Nest access JWT as an **httpOnly** cookie on the Next origin (used after login/register from the client). |
| `POST /api/send` | Resend-backed email (needs `RESEND_API_KEY`). |
| `POST /api/account/totp/enable/start` | **BFF:** forwards to Nest `POST …/auth/totp/enable/start` using the **verified** session cookie JWT (never exposed to client JS). |
| `POST /api/account/totp/enable/confirm` | **BFF:** same for `POST …/auth/totp/enable/confirm` with JSON `{ "code": "123456" }` (6–8 digits). |

These are **requested by the browser** (or by client code) and therefore appear in Chrome DevTools → **Network** when triggered.

**TOTP security model:** the browser calls only the **Next origin** (`/api/account/...`). The Nest access JWT stays **httpOnly**; Next route handlers read it server-side and attach `Authorization: Bearer` to Nest—same trust boundary as [`lib/dal/welcome-user.ts`](lib/dal/welcome-user.ts), without pasting tokens in the page (contrast with the Nest EJS demo).

## Nest calls from the server (“GET system” / `users/me`)

Some data is loaded **only on the Next.js server** during Server Component render or DAL helpers. That uses `fetch()` inside Node, not in the browser.

- **URL builder:** [`lib/server/nest-internal-url.ts`](lib/server/nest-internal-url.ts) — `nestInternalApiUrl(relativePath)` builds an absolute URL:

  `NEXT_PUBLIC_AUTH_API` + `NEXT_PUBLIC_AUTH_API_PREFIX` (default `api`) + path, e.g. `http://localhost:3000/api/users/me` for `relativePath` `"users/me"`.

- **Welcome profile:** [`lib/dal/welcome-user.ts`](lib/dal/welcome-user.ts) — `getWelcomeDashboardUser(lng)` (`"server-only"`):

  1. `verifySession(lng)` (session / cookie checks).
  2. Reads the access token from the **httpOnly** cookie.
  3. **`GET`** `nestInternalApiUrl("users/me")` with `Authorization: Bearer <token>`, `cache: "no-store"`.
  4. Maps the JSON `username` field to UI data; no JWT/email fallback. On failure or missing username, logs **`Aucun pseudo trouvé`** and the UI shows only the plain “Bienvenue” / “Welcome” heading.

**Why DevTools does not show this `GET`:** the request is made **from the Next server to Nest**, while the browser only requests the document (e.g. `GET /fr/welcome-dashboard`). To observe the Nest call, use Nest’s request logs or tooling on the server process—not the browser Network panel (unless you deliberately move the fetch to the client, which has different security implications).

## Related env vars

| Variable | Role |
|----------|------|
| `NEXT_PUBLIC_AUTH_API` | Base URL of the Nest app (required for `nestInternalApiUrl`). |
| `NEXT_PUBLIC_AUTH_API_PREFIX` | Global API prefix (optional; default `api`). |
