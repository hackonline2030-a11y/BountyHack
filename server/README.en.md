# Web API

NestJS API (auth, users, ping) — [Nx](https://nx.dev) workspace.

*French version: [README.md](./README.md)*

1. [Documentation on this repo & useful links](#documentation)
   
2. [API startup](#api-startup)

3. [Installation](#installation)
- [Environment variables and authentication](#environment-variables-and-authentication)
- [Configure the database: with or without Docker](#database-setup-with-or-without-docker)
- [Configure Redis](#configure-redis)

4. Post-installation
- [Seeder](#seeder-users-and-report-draft)
- [Bruno/Postman](#test-auth-brunopostman-passport_jwt--in-memory)
- [Useful commands](#useful-commands)
  
5. [Nx installation notes](#nx-installation-notes)
6. [Troubleshooting](#troubleshooting)
7. [Configure Your LLM](#configure-your-llm)

## Documentation 

### On this repository:

- **Swagger (OpenAPI)**: interactive UI at `/api/docs` (see the *URLs* table for your port). Routes **`auth/password-reset/*`** are documented with request bodies, response schemas, and error codes when **`DATABASE_NAME=POSTGRESQL_PRISMA`**.
- **HTTP notes**: [docs/api.md](./docs/api.md).
- **Architecture decisions (ADR)**: [../docs/adr/architecture_server_adr.md](../docs/adr/architecture_server_adr.md) — includes a **Password reset** section (layers, Prisma scope, security, Swagger).

---

### Useful links

- [Nx docs — Node](https://nx.dev/nx-api/node)
- [Nx on CI](https://nx.dev/ci/intro/ci-with-nx)  


## API startup 

**Complete the installation section first if you have not already**

### Start the API

#### Start in development mode

```bash
pnpm start

# Or directly with Node.js
node dist/main.js  # after build
```

#### Verify the build compiles (for production) 

```bash
pnpm run build
```

#### Tests

Each use case has unit tests.
Integration and e2e tests are present but not at 100% coverage.

```bash
pnpm run test
```

**E2E tests (HTTP)**

Specs under `e2e/` send requests to the URL derived from **`HOST`** and **`PORT`** (see `e2e/src/constants.ts` and `e2e/src/support/test-setup.ts`), default **`http://localhost:3000`**.

```bash
pnpm exec nx run e2e:e2e
```

#### Verification

The API should be reachable at: http://localhost:3000/api

## Installation

### Environment variables and authentication

Create **`server/.env`** from the template (you can stay at the **monorepo root**):

```bash
# at the repository root (if not done yet)
cp server/.env.example server/.env
```

Equivalent if you are already inside **`server/`**:

```sh
cp .env.example .env
```

Then edit **`server/.env`** following **`.env.example`** comments (secrets, `DATABASE_NAME`, `DATABASE_URL`, CORS, etc.).

#### Edit `.env` — essentials:
```env
# MySQL configuration
DATABASE_NAME=MYSQL_PRISMA
DATABASE_URL="mysql://root:[your-password]@localhost:3306/bugbountyapp?allowPublicKeyRetrieval=true"

# API configuration
NODE_ENV=development
JWT_SECRET=dev-secret-key-change-in-production
CORS_ORIGIN=http://localhost:3001
```
`JWT_SECRET` must be identical in `/server` and `/client` `.env` files.

**Generate a secure JWT_SECRET:**

```bash
# Option 1: online
Go to [this link](https://generate-secret.vercel.app/64)

# Option 2: with Node.js
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"

# Option 3: with OpenSSL (Linux/macOS)
openssl rand -hex 64
```

### Authentication and database

**`AUTH_TYPE`** and **`DATABASE_NAME`** work together.

Important points:
- The auth architecture is extensible via `AUTH_TYPE`, but the active implementation is **`PASSPORT_JWT`**.
- Database options remain multiple via `DATABASE_NAME` (`MONGODB`, `MYSQL_PRISMA`, `POSTGRESQL_PRISMA`, `IN-MEMORY`).
- With **`DATABASE_NAME=MONGODB`**, for example, users (email, password hash, profile) are stored in the Mongo database defined by **`DATABASE_URL`**.
- **2FA (schema and upcoming features)**: this layer evolves only under **`DATABASE_NAME=POSTGRESQL_PRISMA`** (Prisma migrations on PostgreSQL). No parallel extension on Mongo or in-memory for 2FA for now; see **`src/auth/README.md`**.

**Update** — we use MYSQL_PRISMA and IN-MEMORY (for tests).

See also the comments in **`.env.example`**.

#### `AUTH_TYPE` configuration and `auth-env.ts`

Authentication configuration is centralized in **`src/auth/config/auth-env.ts`**.

- This file reads and normalizes environment variables (`AUTH_TYPE`, `DATABASE_NAME`).
- It centralizes auth/database configuration choices to avoid scattered checks across Nest modules.

Supported value for **`AUTH_TYPE`**:

- `PASSPORT_JWT`: JWT flow via Passport/Nest (`passport-jwt`).

Recommendation: any new authentication-configuration condition should go through **`auth-env.ts`** instead of direct `process.env.AUTH_TYPE` checks.


## Database setup (with or without Docker)

1. Manual (XAMPP, MySQL + Adminer, or MySQL + phpMyAdmin on Nginx or Apache)
2. With Docker (with or without the script)

### Manual (MySQL on your machine)

#### Create the database
```bash
# With MySQL CLI
mysql -u root -p -e "CREATE DATABASE bugbountyapp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Or with XAMPP via phpMyAdmin: http://localhost/phpmyadmin/
# Create a new database "bugbountyapp" with collation "utf8mb4_unicode_ci"
```

#### Run this command from the terminal to create a bugbountyapp user with the right privileges:

```bash
sudo mysql -u root -e "CREATE USER 'bugbountyapp'@'127.0.0.1' IDENTIFIED BY 'bugbountyapp'; GRANT ALL PRIVILEGES ON bugbountyapp.* TO 'bugbountyapp'@'127.0.0.1'; FLUSH PRIVILEGES;"
```

#### Verify the connection

```bash
mysql -u bugbountyapp -p bugbountyapp bugbountyapp
```

#### Set up the database: 
- VIA A DUMP
- VIA PRISMA

##### VIA A DUMP: Import the dump with test data

**Important**: These commands connect to MySQL on `localhost:3306`. Make sure that:
- XAMPP or your own stack is running
- No other MySQL instance conflicts on port 3306 (if so: see useful commands at the end)

```bash
# Check which MySQL server responds (should show XAMPP databases if you use XAMPP)
mysql -u root -p -e "SHOW DATABASES;"

# Import the full dump (structure + data)
mysql -u root -p bugbountyapp < dump/dump.mysql.native.sql

# Verify the import
mysql -u root -p bugbountyapp -e "SHOW TABLES; SELECT COUNT(*) as users_count FROM users;"
```

**For XAMPP specifically**:
- Default root password: often empty (`""`)
- phpMyAdmin UI: http://localhost/phpmyadmin/
- XAMPP active check: databases `information_schema`, `mysql`, `performance_schema`, `phpmyadmin` should be visible

##### VIA PRISMA

#### Create database tables

```sh
pnpm exec prisma db push
```

#### Generate the Prisma client
```bash
pnpm exec prisma generate
```

---

## Install MySQL DB with Docker

All **`docker compose`** commands below run from **`bugbountyapp/server/`** (paths relative to the compose file and SQL).

For fast API iteration, you can run:

- the NestJS API locally on your machine (faster hot reload, simpler IDE debugging),
- MySQL in Docker,
- Redis in Docker (rate limiting, PDF jobs),
- Adminer and Redis Insight in Docker to browse MySQL and Redis.

We may plug in PostgreSQL or MongoDB later fairly easily — that is why extra commands are also provided.<br>
We will remove them if MySQL remains the final production choice.

From `server/`:

1. Start MySQL + Redis (**`mysql`** and **`redis`** profiles):

Via pnpm (if you granted Docker root rights):

```sh
pnpm run docker:mysql
```

Without pnpm (especially if you prefer not to grant Docker root rights):

The **`mysql`** and **`redis`** profiles are not the compose default — you must specify them explicitly.

```sh
docker compose -f docker/compose.dev.yaml --profile mysql --profile redis up -d mysql adminer redis redisinsight
```

Interfaces:

- **Adminer** (MySQL): http://localhost:8088 — server **`mysql`**, user / password **`bugbountyapp`**
- **Redis Insight** (Redis): http://localhost:5540 — in « Add database »: host **`redis`**, port **`6379`** (Compose DNS name, not `localhost`)

3. Configure `server/.env` to run the API **outside Docker**:

   - `DATABASE_NAME=MYSQL_PRISMA`
   - `DATABASE_URL=mysql://bugbountyapp:bugbountyapp@localhost:3306/bugbountyapp?allowPublicKeyRetrieval=true`
   - `REDIS_HOST=127.0.0.1`, `REDIS_PORT=6379`, `REDIS_URL=redis://127.0.0.1:6379`

   Important: use `localhost` / `127.0.0.1` to reach Docker from the host (API outside the container).

4. Apply Prisma (mysql) from the host:

   ```sh
   pnpm run prisma:generate:mysql
   pnpm run prisma:migrate:deploy:mysql
   ```

5. After starting the API on your machine (see startup section), open the UIs:

   - Adminer (MySQL): `http://localhost:8088`
   - Redis Insight: `http://localhost:5540`

Stop:

```sh
pnpm run docker:mysql:stop
```

```sh
sudo docker compose -f docker/compose.dev.yaml --profile mysql --profile redis stop adminer mysql redis redisinsight
```

Or full teardown:

```sh
pnpm run docker:mysql:down
```

```sh
sudo docker compose -f docker/compose.dev.yaml --profile mysql --profile redis down
```

## Configure Redis

Redis is used by the API (rate limiting, async PDF jobs, etc.). Variables in **`server/.env`**: `REDIS_HOST`, `REDIS_PORT`, `REDIS_URL` (see **`.env.example`**).

### Redis with Docker

With [Install MySQL DB with Docker](#install-mysql-db-with-docker), Redis and Redis Insight start together with MySQL (`--profile mysql --profile redis`).

Redis only (without MySQL):

```sh
docker compose -f docker/compose.dev.yaml --profile redis up -d redis redisinsight
```

The API outside the container uses `REDIS_HOST=127.0.0.1` and `REDIS_PORT=6379` (port exposed on the host).

### Redis locally

Without Docker, install Redis directly on your machine:

- **Linux installation**: [Install Redis — redis.io](https://redis.io/docs/latest/operate/oss_and_stack/install/archive/install-redis/)
- **GUI client (read / edit keys)**: [5 Best Free Redis GUI Clients in 2025 — DbGate](https://www.dbgate.io/news/2025-08-11-free-redis-clients/)

After installation, verify the server responds:

```bash
redis-cli ping
# PONG
```

Then align **`server/.env`** with your local instance (`REDIS_URL=redis://127.0.0.1:6379` by default).

## Seeder (users and report-draft)

We have seeds for users and report-draft.
However, if you installed via dump, users are already present.

Important: verify `DATABASE_NAME=MYSQL_PRISMA` in **`server/.env`**. 
Prisma details: [`prisma/README.md`](prisma/README.md).

### Available test users (check if they are already in the `users` table)

The dump contains several test users (with `password`, `password123`, or `password1234` as password):

| Email | Username | Role | Description |
|-------|----------|------|-------------|
| `demo-user@example.local` | `demo-user` | **SUPER_ADMIN** | Main administrator |
| `coord@example.com` | `Corda` | **COORDINATOR** | Team coordinator |
| `mentor@example.com` | `mentor` | **MENTOR** | Mentor / trainer |
| `qc@example.com` | `Qualité` | **QUALITY_CHECKER** | Quality checker |

**Test login**:
- Email: `demo-user@example.local`
- Password: `password123` or `password` (try one or the other)

Accounts created by the dev-draft seed: 
- `dev-hunter-1@example.local`,
- `dev-qc-1@example.local`,
- `dev-sa-1@example.local`, etc.
Same password as **`demo-user`** (`password123`).

From the super-admin account you can create your own users in each category.

### Seed users WITHOUT DOCKER (with Prisma): 

**Prisma from the host machine** 
- MySQL exposed on `localhost:3306`, without going through the `mysql` container for SQL

```sh
DATABASE_NAME=MYSQL_PRISMA DATABASE_URL=mysql://bugbountyapp:bugbountyapp@127.0.0.1:3306/bugbountyapp \
  pnpm exec prisma db seed
```

### Seed users via docker:
- `pnpm docker:prisma:seed:mysql`

Manual command: see `package.json` at the command above.

### Seed reports VIA DOCKER and prisma + mysql

**SQL seed report-draft cycle** (non-destructive, re-runnable) — equivalent of `pnpm docker:prisma:seed:dev-draft`:

Add `sudo` before if you did not grant Docker root rights: 

```sh
docker compose -f docker/compose.dev.yaml --profile mysql exec -T mysql \
  mysql -ubugbountyapp -pbugbountyapp bugbountyapp \
  < prisma/seed/dev-report-draft-bucket-vault.mysql.sql
```

Shortcuts pnpm (rewrite `DATABASE_URL` from `.env`):
- `pnpm docker:prisma:seed:dev-draft`.


---

## Test auth Bruno/Postman (PASSPORT_JWT + IN-MEMORY)

Dedicated section to quickly verify the auth flow without a database dependency.

### 1) `.env` configuration

In `server/.env`:

- `AUTH_TYPE=PASSPORT_JWT`
- `DATABASE_NAME=IN-MEMORY`
- `JWT_SECRET=mon-lapin-caillousky-dans-la-serre`

### 2) Start the API

From `server/`:

```sh
pnpm run start
```

Default base URL:

- `http://localhost:3000`

### 3) Register (Bruno/Postman)

- Method: `POST`
- URL: `http://localhost:3000/api/auth/register`
- Headers:
  - `Content-Type: application/json`
- Body:

```json
{
  "username": "john-test-20260508",
  "email": "john.test.20260508@example.com",
  "password": "StrongPassword123!"
}
```

Expected response (example):

```json
{
  "token": "<jwt>",
  "user": {
    "email": "john.test.20260508@example.com",
    "uid": "abd4481a-6064-4d17-b57d-71e3e1ecccf1",
    "username": "john-test-20260508"
  },
  "require2FA": false
}
```

### 4) Login (Bruno/Postman)

- Method: `POST`
- URL: `http://localhost:3000/api/auth/login`
- Headers:
  - `Content-Type: application/json`
- Body:

```json
{
  "email": "john.test.20260508@example.com",
  "password": "StrongPassword123!"
}
```

### 5) Verify the JWT on jwt.io

- Paste the token returned by `login` into [jwt.io](https://jwt.io/).
- Use this secret:

```text
mon-lapin-caillousky-dans-la-serre
```

- Verify the signature is valid and the payload includes:
  - `user_id`
  - `email`
  - `sub`
  - `iat`, `exp`

Visual jwt.io configuration example:

![JWT example for local testing](docs/jwt_example.png)

### 6) Test a protected route (optional)

- Method: `GET`
- URL: `http://localhost:3000/api/users/me`
- Header:
  - `Authorization: Bearer <token>`

If everything is correct, the route responds without `401`.

## Useful commands

### Manual installation

```bash
# Full database reset (with Prisma migrations)
pnpm exec prisma migrate reset
pnpm exec prisma db seed

# Graphical interface for the database
pnpm exec prisma studio  # http://localhost:5555

# Re-import the dump if needed
mysql -u root -p bugbountyapp < dump/dump.mysql.native.sql

# Create a super admin in production
pnpm run create-super-admin

# Tests
pnpm run test
```

## Troubleshooting

### Port already in use
```bash
# Change the port in .env
PORT=3001

# Or kill the process
lsof -ti:3000 | xargs kill -9
```

### Manual installation — MySQL connection error
- Verify MySQL works: `mysql -u root -p -e "SELECT 1;"`
- Adjust `DATABASE_URL` in `.env`
- For XAMPP, use: `mysql://root:@localhost:3306/bugbountyapp`

### Manual installation — Prisma error
```bash
# Regenerate the client
DATABASE_NAME=MYSQL_PRISMA pnpm exec prisma generate

# Verify the connection
pnpm exec prisma db pull
```

## Nx installation notes 

## Prerequisites

- **Node.js** 24+ and **pnpm** (see `server/package.json` → `engines`)
- **Docker** and Docker Compose (**optional**, for **local dev** only — not the production target)

### Nx workspace: IDE logic and console logic

Quick summary:
- You can technically start and work on the app without using Nx directly.
- For team work, using Nx as the shared entry point is strongly recommended (same commands, same logic, fewer gaps between devs/CI).
- Without Nx, it is not blocking, but sharing becomes more fragile ("works on my machine", scripts run differently, missed targets).

The `server/` folder is an **Nx workspace**.  
An Nx workspace centralizes:
- projects (e.g. `web-api`, `e2e`)
- their targets (`serve`, `build`, `test`, `lint`, ...)
- their dependencies

Result: you can run the same actions from the IDE or from the console.

#### 1) IDE logic (VS Code / Cursor / JetBrains)

To drive Nx visually, install **Nx Console**.

- **VS Code**
  - Open Extensions.
  - Install **Nx Console** (publisher: `Nrwl`).
  - Reload the window if prompted.

- **Cursor**
  - Cursor uses VS Code extensions.
  - Install **Nx Console** (publisher: `Nrwl`) from the Marketplace.
  - Reload the window.

- **JetBrains** (WebStorm / IntelliJ IDEA / PhpStorm)
  - Open `Settings > Plugins > Marketplace`.
  - Install **Nx Console**.
  - Restart the IDE.

In the IDE, you will see Nx projects and can run targets (`serve`, `build`, `test`) without typing the full command.

#### 2) Console logic (Nx CLI)

If you prefer the terminal, everything runs from `server/`:

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

## Configure Your LLM

To ensure project instructions are applied by an agent (LLM), add an explicit rule in your tool and reference these files:
- [`Agents.md`](./Agents.md)
- [`Claude.md`](./Claude.md)

You can also add skills in **`.agent/`** folders — see the root [Configure Your LLM](../README.md#configurer-son-llm) section (hierarchy, Cursor vs Claude, not auto-loaded).

For the API, prefer:
- **`server/.agent/`** — Nx, Prisma MySQL, Docker/Redis, server conventions
- **`server/src/<module>/.agent/`** (optional) — skill for a specific domain module

**Cursor**: copy/symlink to `.cursor/skills/` to enable a shared skill. **Claude**: reuse the `SKILL.md` from `.agent/`.

Reminder: 1 skill = 1 intent; do not duplicate rules already in [`../Agents.md`](../Agents.md) or [`Agents.md`](./Agents.md).
