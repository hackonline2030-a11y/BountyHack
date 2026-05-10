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
- Auth pages: `/{lng}/register`, `/{lng}/login` (e.g. `/en/login`, `/fr/register`) — forms call Nest (`POST …/auth/login`, `…/auth/register`). After login, the client posts the access JWT to **`POST /api/session`** so Next can store an **`httpOnly` cookie** and run DAL checks (e.g. `/{lng}/welcome-dashboard`).
- Shared UI foundation (sections, buttons, theming)
- Email demo route: `POST /api/send` (disabled when `RESEND_API_KEY` is missing)

## Environment variables

Prerequisite: **`client/.env`** — see **[Installation](#installation)**.

- **`NEXT_PUBLIC_SITE_URL`**: public URL of this Next app (SEO, absolute links).
- **`NEXT_PUBLIC_AUTH_API`**: Nest origin (no trailing slash), e.g. `http://localhost:3000`.
- **`NEXT_PUBLIC_AUTH_API_PREFIX`** (optional): global API segment before `/auth` (default `api` → `http://…/api/auth/login`).
- **`JWT_SECRET`**: must match the Nest `JWT_SECRET`; used to verify the access JWT when setting the httpOnly session cookie (`POST /api/session`) and in the DAL for protected Server Components.
- **`RESEND_API_KEY`**: for `POST /api/send`. If missing or empty, the route logs a warning and returns `503`.

## Scripts

- `pnpm dev`
- `pnpm build`
- `pnpm lint`
- `pnpm test`

## Resend (email demo)

- Route: `POST /api/send`
- Note: `app/api/send/route.ts` uses placeholder values for `from`, `to`, `subject`, and `EmailTemplate({ firstName: 'John' })`.

### Resend configuration

1. Add `RESEND_API_KEY` to `.env` (see `.env.example`).
2. Replace placeholders in `app/api/send/route.ts` with verified sender and real recipients.
3. Adjust `EmailTemplate` props as needed.

### Test

```bash
curl -X POST http://localhost:3001/api/send
```
