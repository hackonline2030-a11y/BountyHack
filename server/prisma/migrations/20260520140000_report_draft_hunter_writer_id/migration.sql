-- Designated hunter who may edit the draft and submit steps (defaults to owner).
ALTER TABLE "report_drafts" ADD COLUMN "hunter_writer_id" TEXT;

UPDATE "report_drafts" SET "hunter_writer_id" = "hunter_id" WHERE "hunter_writer_id" IS NULL;

ALTER TABLE "report_drafts" ALTER COLUMN "hunter_writer_id" SET NOT NULL;

ALTER TABLE "report_drafts" ADD CONSTRAINT "report_drafts_hunter_writer_id_fkey" FOREIGN KEY ("hunter_writer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "report_drafts_hunter_writer_id_idx" ON "report_drafts"("hunter_writer_id");
