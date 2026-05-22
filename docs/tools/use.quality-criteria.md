# Quality criteria module

Bounded context **`server/src/quality`** — RBAC app role **`QUALITY_CHECKER`** only (not report-team `quality_checker`).

## Data model

| Table | Purpose |
|-------|---------|
| `quality_criterion_categories` | Pill color + name; `ON DELETE SET NULL` on criteria |
| `quality_criterion_target_types` | Registry (`report`, `path_course`, …); `requires_target_ref` |
| `quality_criteria` | Code, title, explanation, status `DRAFT` / `PUBLISHED` / `ARCHIVED` |
| `quality_criterion_target_type_links` | Eligibility M:N; `ON DELETE CASCADE` from criterion |
| `quality_criterion_distributions` | QC trigger; optional `target_ref_id` |
| `quality_criterion_checks` | Checkbox per context; `ON DELETE CASCADE` from distribution |

### Optional `target_ref_id`

- **`report`** (`requires_target_ref = true`): one distribution per report draft id.
- **`path_course`** (`requires_target_ref = false`): global distribution (`target_ref_id` null) — same criteria for all path courses.

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

Run `pnpm prisma:migrate:deploy` (or MySQL variant) then `pnpm prisma:seed` for target types.

## Next UI (not in this slice)

- QC admin under `(quality-checker)/`
- Catalog `(user)/quality-criteria`
- Report-draft tab calling instance API with `context`
