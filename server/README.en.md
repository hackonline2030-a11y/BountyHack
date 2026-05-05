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

- **Node.js** 20+ and **pnpm**
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

- If you use **`DATABASE_NAME=MONGODB`**, you should normally set **`AUTH_TYPE=JWT`** unless you already have a **working Firebase setup** (Firebase Admin on the API, credentials, **user accounts in Firebase Authentication** managed in Firebase / the console). Without that, **`AUTH_TYPE=FIREBASE`** does **not** give you a standard email/password sign-up and sign-in flow backed by Mongo: **`POST /api/auth/register`** and **`POST /api/auth/login`** are not enabled, and users are not created in Mongo for that flow.
- **`AUTH_TYPE=JWT`** with Mongo: users (email, password hash, profile) are stored in the Mongo database from **`DATABASE_URL`**.

See the comments in **`.env.example`** as well.

---

## Getting started

Pick **one** path: run everything with Docker, or Node on your machine with MongoDB installed separately.

### 1. With Docker

Always builds and runs the **API** from `docker/Dockerfile` via `docker/compose.dev.yaml`.

**PostgreSQL + pgweb** start **only** when `DATABASE_NAME=POSTGRESQL` in **`server/.env`** (default in `.env.example`). **MongoDB + mongo-express** start **only** when `DATABASE_NAME=MONGODB` (see Mongo notes in `.env.example`). With `FIREBASE`, `IN-MEMORY`, etc., those database containers are not started (no empty stack). Compose **profiles** (`mongodb`, `pg`) keep these sets separate.

1. Environment file: follow **[Installation](#installation)** above (`server/.env` from `server/.env.example`). Set `DATABASE_NAME` according to your backend (`MONGODB`, `POSTGRESQL`, `FIREBASE`, `IN-MEMORY`, …), plus `JWT_SECRET`, CORS, etc.

   **`DATABASE_URL`:** `.env.example` defaults to **PostgreSQL** (e.g. `postgres://…@postgres:5432/…` when the API runs in Docker). **API in Docker** + **`DATABASE_NAME=POSTGRESQL`**: host **`postgres`** on the compose network (not `localhost` from the api container). **API on the host** (`nx serve`) + Postgres in Docker: URL to **`localhost`** and **`POSTGRES_HOST_PORT`**. For **Mongo**, see the “alternative MongoDB” comments in `.env.example`; in Docker, host **`mongodb`** (e.g. `mongodb://mongodb:27017/bugbountyapp`).

2. Start:

   ```sh
   ./docker/start.sh
   ```

   Same entry point: `./docker/start` (wrapper).

   **Stop:** `./docker/start.sh down` — stops **everything** (classic API, **api-watch**, Mongo, mongo-express, Postgres, pgweb, depending on enabled profiles), removes the network and orphans (`--remove-orphans`). Previously, `down` without the `watch` profile could leave `web-api-watch` running and the network “still in use”. Volumes (Mongo, Postgres, `web_api_node_modules`, …): `./docker/start.sh down -v`.

   **Fast API cycle (no image rebuild):**
   - `./docker/start.sh api-restart` (or `./docker/start.sh restart-api`): restarts API without rebuilding the image.
   - `./docker/start.sh api-stop` (or `./docker/start.sh stop-api`): stops the API and, depending on **`DATABASE_NAME`**, the matching Docker DB stack (**MongoDB** when `MONGODB`, **Postgres + pgweb** when `POSTGRESQL`).
   - If `DATABASE_NAME=MONGODB`, the script applies profile **`mongodb`** and targets `mongodb` + `api`.
   - If `DATABASE_NAME=POSTGRESQL`, the script applies profile **`pg`** and orchestrates **`postgres`**, **`pgweb`**, and **`api`** depending on the command (`api-restart` only brings up **`postgres`** + **`api`** — see `start.sh`).
   - Otherwise (`IN-MEMORY`, `FIREBASE`, …), only **`api`** is affected (no compose DB containers).
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

   The script reads **`server/.env`** and adds **`--profile mongodb`** or **`--profile pg`** only when `DATABASE_NAME` is **`MONGODB`** or **`POSTGRESQL`** (including for `down`, so the right services stop).

   **Without** the script — **Mongo**:

   ```sh
   docker compose -f docker/compose.dev.yaml --profile mongodb up --build -d
   ```

   **Without** the script — **Postgres**:

   ```sh
   docker compose -f docker/compose.dev.yaml --profile pg up --build -d
   ```

   **Without** a Compose DB (e.g. Firebase / in-memory):

   ```sh
   docker compose -f docker/compose.dev.yaml up --build -d
   ```

3. **URLs**

   | Service | URL |
   | ------- | --- |
   | API (REST prefix) | `http://localhost:3003/api` (default host port **3003**; override with **`API_HOST_PORT`** in `server/.env`, read by `compose.dev.yaml`) |
   | OpenAPI (Swagger UI) | `http://localhost:3003/api/docs` (same host port) |
   | mongo-express | only if `DATABASE_NAME=MONGODB` — `http://localhost:8086` |
   | pgweb | only if `DATABASE_NAME=POSTGRESQL` — `http://localhost:8087` (override with **`PGWEB_HOST_PORT`**) |
   | MongoDB (from host) | only if `DATABASE_NAME=MONGODB` — `mongodb://localhost:27017` / database `bugbountyapp` |
   | PostgreSQL (from host) | only if `DATABASE_NAME=POSTGRESQL` — `localhost:5432` (override with **`POSTGRES_HOST_PORT`**) |

   **mongo-express:** in dev, the UI does not ask for a password (`ME_CONFIG_BASICAUTH=false` in `compose.dev.yaml`). Without that, the image often defaults to HTTP Basic **admin** / **pass** for the web UI — only use that on a trusted local machine.

With the **Mongo** profile, ensure ports **27017**, **3003** (or **`API_HOST_PORT`**), and **8086** are free. With the **Postgres** profile, ensure **5432** (or **`POSTGRES_HOST_PORT`**), **8087** (or **`PGWEB_HOST_PORT`**), and the API port are free.

**Logs (Mongo mode):** `cd docker && docker compose -f compose.dev.yaml --profile mongodb logs -f`

**Logs (Postgres mode):** `cd docker && docker compose -f compose.dev.yaml --profile pg logs -f`

**Logs (API only):** `cd docker && docker compose -f compose.dev.yaml logs -f`

**Firebase:** Compose does not provision Firebase. If `DATABASE_NAME=FIREBASE` (or you rely on Firebase for auth/data), create a project in the [Firebase console](https://console.firebase.google.com/), add credentials, and configure `.env` (mount or supply `FIREBASE_KEY_PATH` in the container if needed). This is separate from the optional Mongo services above.

---

### 2. Manual setup (Node on the host)

Use this when you prefer **not** to run the API in Docker. You still need a **MongoDB** instance the app can reach (local install, or Mongo only in Docker if you prefer).

1. Install dependencies from the **repository root**:

   ```sh
   pnpm install
   ```

2. Configure **`server/.env`** (see **[Installation](#installation)** if it does not exist yet).

   Keep the default **`DATABASE_URL`** with **`localhost`** (leave the `mongodb://mongodb…` line **commented** — that line is only for the API **inside** Docker). Point to your Mongo instance, typically:

   ```env
   DATABASE_URL=mongodb://localhost:27017/bugbountyapp
   ```

   Set `JWT_SECRET`, `PORT`, `CORS_ORIGIN`, etc. as needed.

3. Run the API in dev (watch mode):

   ```sh
   npx nx serve web-api
   ```

The app listens on `PORT` from `.env` (see `.env.example`; default **3000** unless you change it).

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

- **API already running** (often Docker with host port **`3003`**, from `API_HOST_PORT` in `docker/`) : do **not** start a second `npx nx serve` on the **same** port. Point tests at the container, e.g. `PORT=3003` (and `AUTH_TYPE=JWT` if needed) then `pnpm exec nx run e2e:e2e` — no extra process bound to that port.
- For a **local** `nx serve` **while** Docker watch uses 3003, use a **different** free port (e.g. `3000` or `3010` in your `.env`) and the **same** `PORT` when running e2e.

---

## API documentation

- **Swagger (OpenAPI)** : interactive UI at `/api/docs` (see the *URLs* table for your port).
- **HTTP notes** (French): [docs/api.md](./docs/api.md).

---

## Useful links

- [Nx docs — Node](https://nx.dev/nx-api/node)
- [Nx on CI](https://nx.dev/ci/intro/ci-with-nx)
