# Web API

NestJS API (auth, users, health) — [Nx](https://nx.dev) workspace.

*French version: [README.md](./README.md)*

## Installation

Create **`server/.env`** from the template (from the **monorepo root**):

```bash
# at the repository root (if not done yet)
cp server/.env.example server/.env
```

Equivalent if you are already inside **`server/`**:

```sh
cp .env.example .env
```

Then edit **`server/.env`** following **`.env.example`** (secrets, `DATABASE_NAME`, `DATABASE_URL`, CORS, etc.).

---

## Prerequisites

- **Node.js** 24+ and **pnpm** (see `server/package.json` → `engines`)
- **Docker** and Docker Compose (only if you follow the Docker workflow below)

### Nx Workspace: IDE and Console Logic

Quick summary:
- You can start and work on the app without using Nx directly.
- For team collaboration, using Nx as the shared entry point is strongly recommended (same commands, same logic, fewer dev/CI drifts).
- Without Nx, things are not blocked, but collaboration becomes more fragile ("works on my machine", different scripts, missed targets).

The `server/` folder is an **Nx workspace**.  
An Nx workspace centralizes:
- projects (e.g. `web-api`, `e2e`)
- their targets (`serve`, `build`, `test`, `lint`, ...)
- their dependencies

Result: you can run the same actions either from the IDE or from the console.

#### 1) IDE logic (VS Code / Cursor / JetBrains)

To drive Nx visually, install **Nx Console**.

- **VS Code**
  - Open Extensions.
  - Install **Nx Console** (publisher: `Nrwl`).
  - Reload the window if prompted.

- **Cursor**
  - Cursor supports VS Code extensions.
  - Install **Nx Console** (publisher: `Nrwl`) from the Marketplace.
  - Reload the window.

- **JetBrains** (WebStorm / IntelliJ IDEA / PhpStorm)
  - Open `Settings > Plugins > Marketplace`.
  - Install **Nx Console**.
  - Restart the IDE.

In the IDE, you will see Nx projects and run targets (`serve`, `build`, `test`) directly without typing the full command.

#### 2) Console logic (Nx CLI)

If you prefer terminal-first, run everything from `server/`:

```sh
pnpm exec nx --version
pnpm exec nx show projects
pnpm exec nx show project web-api
pnpm exec nx serve web-api
pnpm exec nx build web-api
pnpm exec nx test web-api
```

In short: **IDE = visual comfort**, **console = explicit control**.  
Both use the same Nx workspace source of truth.

### Authentication and database

**`AUTH_TYPE`** and **`DATABASE_NAME`** work together. Important rule:

- The auth architecture is extensible through `AUTH_TYPE`, but the active implementation is **`PASSPORT_JWT`**.
- Database options remain multiple via `DATABASE_NAME` (`MONGODB`, `POSTGRESQL`, `POSTGRESQL_PRISMA`, `IN-MEMORY`).
- With **`DATABASE_NAME=MONGODB`**, users (email, password hash, profile) are stored in the Mongo database from **`DATABASE_URL`**.
- **2FA (schema and upcoming features)** evolves only under **`DATABASE_NAME=POSTGRESQL_PRISMA`** (Prisma migrations on PostgreSQL). There is no parallel extension on plain `POSTGRESQL`, Mongo, or in-memory for now ; see **`src/auth/README.md`**.

See the comments in **`.env.example`** as well.

#### `AUTH_TYPE` configuration and `auth-env.ts`

Authentication configuration is centralized in **`src/auth/config/auth-env.ts`**.

- This file reads and normalizes environment variables (`AUTH_TYPE`, `DATABASE_NAME`).
- It centralizes auth/database configuration choices to avoid scattered checks across Nest modules.

Supported value for **`AUTH_TYPE`**:

- `PASSPORT_JWT`: Passport/Nest JWT flow (`passport-jwt`).

Recommendation: any new authentication-configuration condition should go through **`auth-env.ts`** instead of direct `process.env.AUTH_TYPE` checks.

---

## Getting started

Pick **one** path: **Docker** (API and optional Postgres + watch), or **Node on the host** with a reachable database (**PostgreSQL + Prisma**, MongoDB, … per **`DATABASE_NAME`**).

### PostgreSQL and Prisma

**`DATABASE_NAME=POSTGRESQL_PRISMA`** for the Prisma-backed `users` flow. Run from **`server/`** after `pnpm install` at the monorepo root.

| Context | Commands |
|--------|----------|
| **Docker — API in watch** (`web-api-watch` + Postgres) | `pnpm docker:watch`, then `pnpm docker:prisma:generate`, `pnpm docker:prisma:deploy`, optional `pnpm docker:prisma:seed-demo`. Same as `./docker/start.sh watch-up` from **`server/docker/`**. |
| **Host — Postgres on `localhost`** | `pnpm prisma generate`, `pnpm prisma migrate deploy`, optional `pnpm prisma:seed-demo`. If `DATABASE_URL` still uses `@postgres`, use `pnpm prisma:migrate:deploy:docker` and `pnpm prisma:seed-demo:docker`. |

Details: [`docker/README.md`](docker/README.md#prisma-migrations-et-démo) and **`.env.example`**. Demo login: `demo-user@example.local` / `password123`.

### 1. With Docker

Always builds and runs the **API** from `docker/Dockerfile` via `docker/compose.dev.yaml`. Full guide: [`docker/README.md`](docker/README.md).

**PostgreSQL + pgweb** start when **`DATABASE_NAME`** is **`POSTGRESQL`** or **`POSTGRESQL_PRISMA`**. **MongoDB + mongo-express** start when **`DATABASE_NAME=MONGODB`**. With `IN-MEMORY`, those database containers are not started. Compose **profiles** (`mongodb`, `pg`) keep these sets separate.

1. Environment file: follow **[Installation](#installation)** above (`server/.env` from `server/.env.example`). Set `DATABASE_NAME` (`MONGODB`, `POSTGRESQL`, `POSTGRESQL_PRISMA`, `IN-MEMORY`, …), plus `JWT_SECRET`, CORS, etc.

   **`DATABASE_URL`:** `.env.example` defaults to **PostgreSQL** (e.g. `postgres://…@postgres:5432/…` when the API runs in Docker). **API in Docker** + **`pg`** profile: host **`postgres`** on the compose network (not `localhost` from the api container). **API on the host** (`nx serve`) + Postgres in Docker: URL to **`localhost`** / **`127.0.0.1`** and **`POSTGRES_HOST_PORT`**. For **Mongo**, see `.env.example`; in Docker, host **`mongodb`** (e.g. `mongodb://mongodb:27017/bugbountyapp`).

2. Start:

   ```sh
   ./docker/start.sh
   ```

   Same entry point: `./docker/start` (wrapper).

   **Stop:** `./docker/start.sh down` — stops **everything** (classic API, **api-watch**, Mongo, mongo-express, Postgres, pgweb, depending on enabled profiles), removes the network and orphans (`--remove-orphans`). Previously, `down` without the `watch` profile could leave `web-api-watch` running and the network “still in use”. Volumes (Mongo, Postgres, `web_api_node_modules`, …): `./docker/start.sh down -v`.

   **Fast API cycle (no image rebuild):**
   - `./docker/start.sh api-restart` (or `./docker/start.sh restart-api`): restarts API without rebuilding the image.
   - `./docker/start.sh api-stop` (or `./docker/start.sh stop-api`): stops the API and, depending on **`DATABASE_NAME`**, the matching Docker DB stack (**MongoDB** when `MONGODB`, **Postgres + pgweb** when **`POSTGRESQL`** or **`POSTGRESQL_PRISMA`**).
   - If `DATABASE_NAME=MONGODB`, the script applies profile **`mongodb`** and targets `mongodb` + `api`.
   - If `DATABASE_NAME=POSTGRESQL` or `POSTGRESQL_PRISMA`, the script applies profile **`pg`** and orchestrates **`postgres`**, **`pgweb`**, and **`api`** depending on the command (`api-restart` only brings up **`postgres`** + **`api`** — see `start.sh`).
   - Otherwise (`IN-MEMORY`, …), only **`api`** is affected (no compose DB containers).
   - After `./docker/start.sh` (`up`), the script tails API logs in the terminal (`logs -f api`).
     - Exit live tail: `Ctrl+C` (containers keep running).
     - Disable this behavior: `API_FOLLOW_LOGS=0 ./docker/start.sh`.

   **Watch mode (dev inside container, no rebuild on each change):**
   - `./docker/start.sh watch-up` (alias `dev-up`): starts `api-watch` with source bind mount (repo -> `/usr/src/app`) and Nest/Nx watcher inside the container.
   - Container `node_modules` use a **Docker volume** (separate from the host): on **startup**, `pnpm install` runs so the tree matches the mounted `package.json` / `pnpm-lock.yaml`. The repo ships **`.npmrc`** (`confirm-modules-purge=false`) so pnpm does not prompt in a non-TTY session (otherwise the install can stop before packages are written). After you add or change a dependency on the host, **commit the lockfile**, then **restart** watch — you do not need to remove the volume every time.
   - If the deps volume looks broken: `watch-stop` then `docker volume rm web-api-dev_web_api_node_modules` (or the name from `docker volume ls | grep web-api`), then `watch-up`.
   - Code edits on the host are automatically reflected in the container (hot reload).
   - `./docker/start.sh watch-stop` (alias `dev-stop`): stops watch mode (and Mongo or Postgres + pgweb when that profile is active, same idea as `watch-up`).
   - `api-watch` runs **root** only for `pnpm install` (the `node_modules` named volume is root-owned by default) then **Nx** as user **`node`**. TTY: `docker exec -it web-api-watch sh` (root) or `docker exec -it -u node web-api-watch sh` for a `node` shell.
   - In watch mode, `api-watch` logs are tailed live at the end of the command.

   **Demo user import (Mongo):**
   - `./docker/start.sh dump-users`: imports `docker/dump/user.json` into `bugbountyapp.users` with `--jsonArray --drop` (collection is replaced before import).
   - Demo login credentials:
     - **email**: `demo-user@example.local`
     - **password**: `password123`
   - To create another dump user, generate `passwordHash` with the same API algorithm (scrypt, `salt:hash` format):
   ```sh
   node -e 'const crypto=require("crypto"); const salt=crypto.randomBytes(16).toString("hex"); const hash=crypto.scryptSync("password123",salt,64).toString("hex"); console.log(salt+":"+hash);'
   ```
   - Copy the output into `passwordHash` in `docker/dump/user.json` (hash changes every run because salt is random).

   The script reads **`server/.env`** and adds **`--profile mongodb`** or **`--profile pg`** only when `DATABASE_NAME` is **`MONGODB`**, **`POSTGRESQL`**, or **`POSTGRESQL_PRISMA`** (including for `down`, so the right services stop).

   **Without** the script — **Mongo**:

   ```sh
   docker compose -f docker/compose.dev.yaml --profile mongodb up --build -d
   ```

   **Without** the script — **Postgres**:

   ```sh
   docker compose -f docker/compose.dev.yaml --profile pg up --build -d
   ```

   **Without** a Compose DB (e.g. in-memory):

   ```sh
   docker compose -f docker/compose.dev.yaml up --build -d
   ```

3. **URLs**

   | Service | URL |
   | ------- | --- |
   | API (REST prefix) | `http://localhost:3003/api` (default host port **3003**; override with **`API_HOST_PORT`** in `server/.env`, read by `compose.dev.yaml`) |
   | OpenAPI (Swagger UI) | `http://localhost:3003/api/docs` (same host port) |
   | mongo-express | if **`DATABASE_NAME=MONGODB`** — `http://localhost:8086` |
   | pgweb | if **`pg`** profile (`POSTGRESQL` or `POSTGRESQL_PRISMA`) — `http://localhost:8087` (override **`PGWEB_HOST_PORT`**) |
   | MongoDB (from host) | if **`DATABASE_NAME=MONGODB`** — `mongodb://localhost:27017` / database `bugbountyapp` |
   | PostgreSQL (from host) | if **`pg`** profile — `localhost:5432` (override **`POSTGRES_HOST_PORT`**) |

   **mongo-express:** in dev, the UI does not ask for a password (`ME_CONFIG_BASICAUTH=false` in `compose.dev.yaml`). Without that, the image often defaults to HTTP Basic **admin** / **pass** for the web UI — only use that on a trusted local machine.

With the **Mongo** profile, ensure ports **27017**, **3003** (or **`API_HOST_PORT`**), and **8086** are free. With the **Postgres** profile, ensure **5432** (or **`POSTGRES_HOST_PORT`**), **8087** (or **`PGWEB_HOST_PORT`**), and the API port are free.

**Logs (Mongo mode):** `cd docker && docker compose -f compose.dev.yaml --profile mongodb logs -f`

**Logs (Postgres mode):** `cd docker && docker compose -f compose.dev.yaml --profile pg logs -f`

**Logs (API only):** `cd docker && docker compose -f compose.dev.yaml logs -f`

### 2. Manual setup (Node on the host)

Without the **API** container. Provide a database reachable from your machine (Postgres and/or Mongo per **`DATABASE_NAME`**).

1. **Dependencies** (repository root):

   ```sh
   pnpm install
   ```

2. **`server/.env`** (see **[Installation](#installation)**).

   **PostgreSQL + Prisma:** `DATABASE_NAME=POSTGRESQL_PRISMA`, **`DATABASE_URL`** with host **`localhost`** (or `127.0.0.1`). Then apply the schema — **[PostgreSQL and Prisma](#postgresql-and-prisma)** (`prisma generate`, `migrate deploy`, optional seed).

   **MongoDB:** `DATABASE_URL=mongodb://localhost:27017/bugbountyapp` (`mongodb://mongodb…` in `.env.example` is for the API **in Docker** only).

   Set `JWT_SECRET`, `PORT`, `CORS_ORIGIN`, etc.

3. **Dev API:**

   ```sh
   npx nx serve web-api
   ```

   Listens on **`PORT`** from `.env` (default **3000**; align e2e if the Docker API uses **3003** on the host).

---

## Other commands

```sh
npx nx build web-api
```

```sh
npx nx show project web-api
```

[Running tasks in Nx](https://nx.dev/features/run-tasks)

### E2E tests (HTTP)

Specs under `e2e/` call the base URL from **`HOST`** and **`PORT`** (see `e2e/src/constants.ts` and `e2e/src/support/test-setup.ts`), default **`http://localhost:3000`**.

- **API already running** (often Docker with host port **`3003`**, from `API_HOST_PORT` in `docker/`) : do **not** start a second `npx nx serve` on the **same** port. Point tests at the container, e.g. `PORT=3003` (and `AUTH_TYPE=PASSPORT_JWT` if needed) then `pnpm exec nx run e2e:e2e` — no extra process bound to that port.
- For a **local** `nx serve` **while** Docker watch uses 3003, use a **different** free port (e.g. `3000` or `3010` in your `.env`) and the **same** `PORT` when running e2e.

---

## API documentation

- **Swagger (OpenAPI)** : interactive UI at `/api/docs` (see the *URLs* table for your port).
- **HTTP notes** (French): [docs/api.md](./docs/api.md).

---

## Useful links

- [Nx docs — Node](https://nx.dev/nx-api/node)
- [Nx on CI](https://nx.dev/ci/intro/ci-with-nx)
