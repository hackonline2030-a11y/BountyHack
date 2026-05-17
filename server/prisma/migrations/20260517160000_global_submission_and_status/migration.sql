-- AlterEnum
ALTER TYPE "ReportDraftAggregateStatus" ADD VALUE IF NOT EXISTS 'UNDER_GLOBAL_REVIEW';

-- CreateTable
CREATE TABLE IF NOT EXISTS "global_submissions" (
    "id" TEXT NOT NULL,
    "report_draft_id" TEXT NOT NULL,
    "revision_number" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitted_by" TEXT NOT NULL,
    "reviewer_role" "ReviewerRole" NOT NULL,
    "decision" "SubmissionDecision" NOT NULL DEFAULT 'PENDING',
    "decided_at" TIMESTAMP(3),
    "decided_by" TEXT,

    CONSTRAINT "global_submissions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "global_reviewer_comments" (
    "id" TEXT NOT NULL,
    "global_submission_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "author_role" "ReviewerRole" NOT NULL,
    "anchor" JSONB,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "global_reviewer_comments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "gs_draft_rev_role_uq"
ON "global_submissions"("report_draft_id", "revision_number", "reviewer_role");

CREATE INDEX IF NOT EXISTS "global_submissions_report_draft_id_idx" ON "global_submissions"("report_draft_id");
CREATE INDEX IF NOT EXISTS "global_submissions_reviewer_role_decision_idx" ON "global_submissions"("reviewer_role", "decision");
CREATE INDEX IF NOT EXISTS "global_reviewer_comments_global_submission_id_idx" ON "global_reviewer_comments"("global_submission_id");

ALTER TABLE "global_submissions"
ADD CONSTRAINT "global_submissions_report_draft_id_fkey"
FOREIGN KEY ("report_draft_id") REFERENCES "report_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "global_reviewer_comments"
ADD CONSTRAINT "global_reviewer_comments_global_submission_id_fkey"
FOREIGN KEY ("global_submission_id") REFERENCES "global_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Existing open super-admin revisions → under-global-review
UPDATE "report_drafts"
SET "aggregate_status" = 'UNDER_GLOBAL_REVIEW'
WHERE "super_admin_revision_requested_at" IS NOT NULL
  AND "aggregate_status" = 'UNDER_REVIEW';
