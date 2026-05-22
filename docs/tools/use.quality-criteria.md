# Quality criteria module

Bounded context **`server/src/quality`** — RBAC app role **`QUALITY_CHECKER`** only (not report-team `quality_checker`).

## Data model

| Table | Purpose |
|-------|---------|
| `quality_criterion_categories` | Pill color + name; `ON DELETE SET NULL` on criteria |
| `quality_criterion_target_types` | Registry (`report`, `path_course`, …); `requires_target_ref` |
| `quality_criteria` | Code, title, explanation, status `DRAFT` / `PUBLISHED` / `ARCHIVED` |
| `quality_criterion_target_type_links` | Eligibility M:N (set at **distribution**, not when defining the criterion) |
| `quality_criterion_distributions` | QC activation on a scope; optional `target_ref_id` |
| `quality_criterion_checks` | Checkbox per context; `ON DELETE CASCADE` from distribution |

### Lifecycle (three steps)

1. **Define** — code, title, explanation, category (draft → published). No target objects yet.
2. **Distribute** (admin tab *Distribution*) — pick published criterion + target type; scope is per-type:
   - **`report`** (`requires_target_ref = true`): one row per report draft id (specific id).
   - **`path_course`** (`requires_target_ref = false`): `target_ref_id` null — applies to **all** path courses.
3. **Workflow** — each target type has its **own** UI (not shared). Example: `report` → Criteria tab on report-draft review with QC checkboxes. `path_course` → to be implemented in the course module.

Eligibility links are created automatically on first distribution for that type.

### Optional `target_ref_id`

Uniqueness: `(criterion_id, target_type_id, COALESCE(target_ref_id, ''))`.

### Cascades

- Delete **criterion** → links, distributions, checks removed.
- Delete **distribution** → checks removed.
- Delete **category** → criteria `category_id` set null (unclassified).
- Delete **target type** → blocked if links or distributions exist (`RESTRICT`).

## API (`/api/quality/...`)

| Area | QC manager | Readers | Mentor/QC checks |
|------|------------|---------|------------------|
| Categories CRUD | yes | list | — |
| Target types CRUD | yes | list | — |
| Criteria CRUD + publish/archive | yes | published catalog | — |
| Distributions CRUD | yes | list on instance | — |
| Patch check | — | — | mentor + `QUALITY_CHECKER` |

Report instance checklist: `GET /api/quality/instances/report/criteria?targetRefId={draftId}&context=submission_review`

BFF proxy: `client/app/api/quality/[[...path]]/route.ts` → Nest.

## Migrations

- Postgres: `prisma/migrations/20260522120000_quality_criteria`
- MySQL: `prisma/migrations-mysql/20260522120000_quality_criteria`

Run migrations then seed target types:

```bash
cd server
# MySQL / MariaDB (prod VPS)
DATABASE_NAME=MYSQL_PRISMA pnpm exec prisma migrate deploy
DATABASE_NAME=MYSQL_PRISMA pnpm exec prisma db seed
```

Use `pnpm run prisma:migrate:deploy:mysql` (not bare `pnpm migrate`).

### MySQL / MariaDB: failed `20260522120000_quality_criteria` (P3018 / P3009)

MariaDB rejects `UNIQUE (..., (COALESCE(...)))` and often rejects **generated** columns too. The MySQL migration uses a plain column `target_ref_scope` (filled by the Nest API on insert).

**P3009** = a failed row still exists in `_prisma_migrations`. You must resolve + drop partial tables, then redeploy.

On the VPS (after `git pull`):

```bash
cd ~/bugbountyapp/server
chmod +x scripts/vps-mysql-recover-quality-migration.sh
./scripts/vps-mysql-recover-quality-migration.sh
DATABASE_NAME=MYSQL_PRISMA pnpm exec prisma db seed
```

Manual equivalent:

```bash
cd server
export DATABASE_NAME=MYSQL_PRISMA
pnpm exec prisma migrate resolve --rolled-back 20260522120000_quality_criteria
pnpm exec prisma db execute --stdin <<'SQL'
DROP TABLE IF EXISTS quality_criterion_checks;
DROP TABLE IF EXISTS quality_criterion_distributions;
DROP TABLE IF EXISTS quality_criterion_target_type_links;
DROP TABLE IF EXISTS quality_criteria;
DROP TABLE IF EXISTS quality_criterion_target_types;
DROP TABLE IF EXISTS quality_criterion_categories;
SQL
pnpm exec prisma migrate deploy
pnpm exec prisma generate
```

Verify the migration file on the server:

```bash
grep target_ref_scope prisma/migrations-mysql/20260522120000_quality_criteria/migration.sql
# must show: NOT NULL DEFAULT ''  (not COALESCE, not AS (IFNULL
```

## Next UI (not in this slice)

- QC admin under `(quality-checker)/`
- Catalog `(user)/quality-criteria`
- Report-draft tab calling instance API with `context`
