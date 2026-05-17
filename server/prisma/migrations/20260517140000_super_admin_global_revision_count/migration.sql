-- AlterTable
ALTER TABLE "report_drafts" ADD COLUMN IF NOT EXISTS "super_admin_global_revision_count" INTEGER NOT NULL DEFAULT 0;

UPDATE "report_drafts"
SET "super_admin_global_revision_count" = 1
WHERE "super_admin_revision_requested_at" IS NOT NULL
  AND "super_admin_global_revision_count" = 0;
