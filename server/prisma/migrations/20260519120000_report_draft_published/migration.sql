ALTER TYPE "ReportDraftAggregateStatus" ADD VALUE IF NOT EXISTS 'PUBLISHED';

UPDATE "report_drafts"
SET "aggregate_status" = 'PUBLISHED'
WHERE "aggregate_status" = 'SUBMITTED_TO_PROGRAM';
