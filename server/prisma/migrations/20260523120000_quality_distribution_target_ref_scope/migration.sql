-- Align Postgres with app-maintained `target_ref_scope` (MySQL migration uses a plain column).
ALTER TABLE "quality_criterion_distributions"
  ADD COLUMN "target_ref_scope" TEXT NOT NULL DEFAULT '';

UPDATE "quality_criterion_distributions"
SET "target_ref_scope" = COALESCE("target_ref_id", '');

DROP INDEX IF EXISTS "quality_criterion_distributions_scope_unique";

CREATE UNIQUE INDEX "quality_criterion_distributions_scope_unique"
  ON "quality_criterion_distributions" ("criterion_id", "target_type_id", "target_ref_scope");
