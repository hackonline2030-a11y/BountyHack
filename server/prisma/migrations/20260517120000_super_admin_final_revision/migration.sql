-- Super-admin global revision marker (final validation workflow).
ALTER TABLE "report_drafts"
ADD COLUMN IF NOT EXISTS "super_admin_revision_requested_at" TIMESTAMP(3);
