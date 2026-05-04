## Auth-first Next.js Template

Reusable Next.js App Router starter with authentication flows (register/login) already wired.

## Getting started

This repo uses **[pnpm](https://pnpm.io)** (`packageManager` is pinned in `package.json`). Enable Corepack once, then install and run:

```bash
corepack enable
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Included

- Auth pages: `/{lng}/register`, `/{lng}/login` (e.g. `/en/login`, `/fr/register`)
- Auth API routes under `/api/auth`
- Shared UI foundation (sections, buttons, theming)
- Email demo route: `POST /api/send` (disabled when `RESEND_API_KEY` is missing)

## Environment variables

Create a `.env` file (copy `.env.example`).

- **Database (Prisma)**  
  - Default: **`DATABASE_PROVIDER=sqlite`** and **`DATABASE_URL=file:./prisma/dev.db`** (file under `prisma/`).  
  - Optional **PostgreSQL** (e.g. `docker compose` with the `db` service): set **`DATABASE_PROVIDER=postgresql`** and **`DATABASE_URL=postgresql://USER:PASS@HOST:5432/DB`**.  
  - After switching provider, run **`pnpm db:generate`** (or `pnpm install`) so the Prisma client matches the provider.  
  - SQLite migrations live under `prisma/migrations` (SQLite only). For a fresh Postgres DB, use **`pnpm exec prisma db push`** with Postgres env vars set.
- `RESEND_API_KEY`: required for `POST /api/send`.
  - If it is missing or an empty string, the route will `console.warn(...)` and return `503` (email sending disabled).

## Scripts

- `pnpm dev`
- `pnpm build`
- `pnpm lint`
- `pnpm test`

## Resend (email demo)

This template includes a demo endpoint to show how to send emails with Resend.

- Route: `POST /api/send`
- Note: `app/api/send/route.ts` uses placeholder/fake values for:
  - `from` address
  - `to` recipient(s)
  - `subject`
  - a sample `EmailTemplate({ firstName: 'John' })`

### Resend configuration

1. Set your API key
   - Add `RESEND_API_KEY` to `.env` (see `.env.example`).
   - If `RESEND_API_KEY` is missing or `""`, the route will `console.warn(...)` and return `503` (email sending disabled).

2. Update placeholders in `app/api/send/route.ts` 
   - Replace the `from` sender with a sender configured/verified in your Resend dashboard.
   - Replace the `to` list with your real recipient(s).
   - Replace the `subject` with what you need.

3. Update the email body/template
   - The demo currently calls `EmailTemplate({ firstName: 'John' })`.
   - Adjust the template props to match your real use-case.

### Test

```bash
curl -X POST http://localhost:3000/api/send