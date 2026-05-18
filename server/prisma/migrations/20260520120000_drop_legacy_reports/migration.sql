-- Legacy `reports` + `report_drafts.pending_report_id` are unused: published drafts are the PDF source of truth.

ALTER TABLE "report_drafts" DROP CONSTRAINT IF EXISTS "report_drafts_pending_report_id_fkey";

DROP INDEX IF EXISTS "report_drafts_pending_report_id_key";

ALTER TABLE "report_drafts" DROP COLUMN IF EXISTS "pending_report_id";

DROP TABLE IF EXISTS "reports";

DROP TYPE IF EXISTS "ReportStatus";
