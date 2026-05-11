## Next.js frontend (Bug Bounty)

UI-focused Next.js App Router app: auth forms call the **Nest** API (`NEXT_PUBLIC_AUTH_API`).

## Getting started

### Installation

Create **`client/.env`** from the template (from the **monorepo root**):

```bash
# at the repo root (if not done yet)
cp bugbountyapp/client/.env.example bugbountyapp/client/.env
```

Equivalent if you are already in **`client/`**:

```bash
cp .env.example .env
```

Adjust **`client/.env`** as needed (see **Environment variables** below and `client/.env.example`).

### Run

This workspace uses **[pnpm](https://pnpm.io)** (`packageManager` is pinned in `package.json`). Enable Corepack once, then install and run:

```bash
corepack enable
pnpm install
pnpm dev
```

Open [http://localhost:3001](http://localhost:3001). Next dev runs on **3001** (`next dev -p 3001`) so the Nest API can use **3000** by default. For another port: `pnpm dev -- --port 3010` (and align **`CORS_ORIGIN`** in **`server/.env`**).

**API (CORS)** : the browser origin (`http://localhost:3001` in dev) must be allowed by Nest — see **`server/.env.example`** and **`server/src/shared/cors.util.ts`**.

## Included

- Auth module (`modules/auth/core/`): ports (`gateway/`), Next + **jose** adapters (`gateway-infra/`, see `JoseJwtHs256AccessTokenVerifier`), use cases, and **`auth.factory.ts`** wiring; `app/api` and `lib/dal` stay thin adapters.
- Auth: **`/{lng}/login`** (public); **`/{lng}/administration/register`** (**`verifySessionForRoles(lng, [AppRoleCode.SUPER_ADMIN])`** in [`lib/dal/session.ts`](lib/dal/session.ts); other roles → **`welcome-dashboard`**). Register uses **`POST /api/account/register-user`** so Next attaches the admin Bearer (Nest rejects `POST …/auth/register` without **`SUPER_ADMIN`** JWT). **`POST …/auth/login`** still hits Nest directly. After login, **`POST /api/session`** stores the **`httpOnly` cookie** for DAL/BFF checks.
- Login UX is 2-step when needed: step 1 (email+password), then step 2 (TOTP code) only when backend responds `TOTP code required`. If TOTP is not enabled for the account, step 1 directly creates the session.
- **Settings** `/{lng}/parameters`: TOTP is managed via switch (on/off). UI calls Next BFF routes **`POST /api/account/totp/enable/start`**, **`…/enable/confirm`**, and **`…/disable`**. These proxy to Nest **`auth/totp/enable/*`** and **`auth/totp/disable`** using the same httpOnly session (see `routes.md`).
- TOTP front architecture: `TotpEnrollmentPanel` depends on auth core use cases (`start/confirm/disable TotpEnrollmentUseCase`) and a gateway contract (`ITotpManagementGateway`) wired in `totp-management.factory.ts` (client-safe; no `next/headers`). Session/JWT wiring stays in `auth.factory.ts` (server-only).
- Header uses **`GET /api/session/status`** to display live session metadata in client UI: username and role after app name, `Mes paramètres` when authenticated, and `Admin` link only for `SUPER_ADMIN`. Logout: browser use case **`performBrowserLogoutUseCase`** (`browser-logout.factory` → `logoutFromBrowser`), then **`destroyAppSessionUseCase`** on **`DELETE /api/session`** (`auth.factory` → `createDestroyAppSessionDependencies`).
- Shared UI foundation (sections, buttons, theming)

## Environment variables

Prerequisite: **`client/.env`** — see **[Installation](#installation)**.

- **`NEXT_PUBLIC_SITE_URL`**: public URL of this Next app (SEO, absolute links).
- **`NEXT_PUBLIC_AUTH_API`**: Nest origin (no trailing slash), e.g. `http://localhost:3000`.
- **`NEXT_PUBLIC_AUTH_API_PREFIX`** (optional): global API segment before `/auth` (default `api` → `http://…/api/auth/login`).
- **`JWT_SECRET`**: must match the Nest `JWT_SECRET`; used to verify the access JWT when setting the httpOnly session cookie (`POST /api/session`) and in the DAL for protected Server Components.

## Scripts

- `pnpm dev`
- `pnpm build`
- `pnpm lint`
- `pnpm test`

