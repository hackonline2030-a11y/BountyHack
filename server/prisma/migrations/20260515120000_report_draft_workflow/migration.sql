-- Report draft workflow (MCD v1): drafts, steps, submissions, reports, snapshots.

-- CreateEnum
CREATE TYPE "DraftStep" AS ENUM ('META', 'DESCRIPTION', 'COLLECTION', 'EXPLOITATION', 'PROOF_OF_CONCEPT', 'RISKS', 'REMEDIATION', 'FINAL');

-- CreateEnum
CREATE TYPE "StepStatus" AS ENUM ('IN_PROGRESS', 'AWAITING_REVIEW', 'NEEDS_REVISION', 'APPROVED');

-- CreateEnum
CREATE TYPE "ReportDraftAggregateStatus" AS ENUM ('DRAFT', 'UNDER_REVIEW', 'READY_TO_PROGRAM', 'SUBMITTED_TO_PROGRAM', 'GIVEN_UP', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReviewerRole" AS ENUM ('HUNTER', 'MENTOR', 'QUALITY_CHECKER', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "SubmissionKind" AS ENUM ('HUNTER_TO_REVIEWER', 'HUNTER_TO_MENTOR', 'MENTOR_TO_QC', 'QC_TO_MENTOR', 'QC_TO_SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "SubmissionDecision" AS ENUM ('PENDING', 'APPROVE', 'REQUEST_CHANGES');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'PUBLISHED');

-- CreateTable
CREATE TABLE "report_drafts" (
    "id" TEXT NOT NULL,
    "hunter_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "aggregate_status" "ReportDraftAggregateStatus" NOT NULL DEFAULT 'DRAFT',
    "pending_report_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_draft_steps" (
    "id" TEXT NOT NULL,
    "report_draft_id" TEXT NOT NULL,
    "step" "DraftStep" NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "status" "StepStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "current_round" INTEGER NOT NULL DEFAULT 0,
    "assigned_reviewer_role" "ReviewerRole",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_draft_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_draft_attachments" (
    "id" TEXT NOT NULL,
    "report_draft_step_id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "storage_key" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "uploaded_by" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_draft_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" TEXT NOT NULL,
    "report_draft_step_id" TEXT NOT NULL,
    "report_draft_id" TEXT NOT NULL,
    "step" "DraftStep" NOT NULL,
    "round" INTEGER NOT NULL,
    "submission_kind" "SubmissionKind" NOT NULL DEFAULT 'HUNTER_TO_REVIEWER',
    "payload" JSONB NOT NULL,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitted_by" TEXT NOT NULL,
    "reviewer_role" "ReviewerRole" NOT NULL,
    "decision" "SubmissionDecision" NOT NULL DEFAULT 'PENDING',
    "decided_at" TIMESTAMP(3),
    "decided_by" TEXT,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviewer_comments" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "author_role" "ReviewerRole" NOT NULL,
    "anchor" JSONB,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "reviewer_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submission_attachment_snapshots" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "storage_key" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "uploaded_at" TIMESTAMP(3) NOT NULL,
    "uploaded_by" TEXT NOT NULL,

    CONSTRAINT "submission_attachment_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submission_content_snapshots" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "captured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submission_content_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "hunter_id" TEXT NOT NULL,
    "source_draft_id" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "frozen_content" JSONB,
    "content_synced_at" TIMESTAMP(3),
    "promoted_by" TEXT,
    "published_by" TEXT,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "report_drafts_pending_report_id_key" ON "report_drafts"("pending_report_id");

-- CreateIndex
CREATE INDEX "report_drafts_hunter_id_idx" ON "report_drafts"("hunter_id");

-- CreateIndex
CREATE INDEX "report_drafts_aggregate_status_idx" ON "report_drafts"("aggregate_status");

-- CreateIndex
CREATE INDEX "report_draft_steps_report_draft_id_idx" ON "report_draft_steps"("report_draft_id");

-- CreateIndex
CREATE UNIQUE INDEX "report_draft_steps_report_draft_id_step_key" ON "report_draft_steps"("report_draft_id", "step");

-- CreateIndex
CREATE INDEX "report_draft_attachments_report_draft_step_id_idx" ON "report_draft_attachments"("report_draft_step_id");

-- CreateIndex
CREATE INDEX "submissions_report_draft_id_idx" ON "submissions"("report_draft_id");

-- CreateIndex
CREATE INDEX "submissions_reviewer_role_decision_idx" ON "submissions"("reviewer_role", "decision");

-- CreateIndex
CREATE UNIQUE INDEX "submissions_report_draft_step_id_round_reviewer_role_submis_key" ON "submissions"("report_draft_step_id", "round", "reviewer_role", "submission_kind");

-- CreateIndex
CREATE INDEX "reviewer_comments_submission_id_idx" ON "reviewer_comments"("submission_id");

-- CreateIndex
CREATE INDEX "submission_attachment_snapshots_submission_id_idx" ON "submission_attachment_snapshots"("submission_id");

-- CreateIndex
CREATE INDEX "submission_content_snapshots_submission_id_idx" ON "submission_content_snapshots"("submission_id");

-- CreateIndex
CREATE UNIQUE INDEX "reports_source_draft_id_key" ON "reports"("source_draft_id");

-- CreateIndex
CREATE INDEX "reports_hunter_id_idx" ON "reports"("hunter_id");

-- CreateIndex
CREATE INDEX "reports_status_idx" ON "reports"("status");

-- AddForeignKey
ALTER TABLE "report_drafts" ADD CONSTRAINT "report_drafts_hunter_id_fkey" FOREIGN KEY ("hunter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_draft_steps" ADD CONSTRAINT "report_draft_steps_report_draft_id_fkey" FOREIGN KEY ("report_draft_id") REFERENCES "report_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_draft_attachments" ADD CONSTRAINT "report_draft_attachments_report_draft_step_id_fkey" FOREIGN KEY ("report_draft_step_id") REFERENCES "report_draft_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_report_draft_step_id_fkey" FOREIGN KEY ("report_draft_step_id") REFERENCES "report_draft_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_report_draft_id_fkey" FOREIGN KEY ("report_draft_id") REFERENCES "report_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviewer_comments" ADD CONSTRAINT "reviewer_comments_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_attachment_snapshots" ADD CONSTRAINT "submission_attachment_snapshots_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_content_snapshots" ADD CONSTRAINT "submission_content_snapshots_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_hunter_id_fkey" FOREIGN KEY ("hunter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey (circular: draft.pending_report_id → reports, after reports exists)
ALTER TABLE "report_drafts" ADD CONSTRAINT "report_drafts_pending_report_id_fkey" FOREIGN KEY ("pending_report_id") REFERENCES "reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;
