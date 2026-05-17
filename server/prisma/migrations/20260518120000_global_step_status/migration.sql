-- Global revision step statuses (parallel to per-step QC workflow).
ALTER TYPE "StepStatus" ADD VALUE IF NOT EXISTS 'IN_GLOBAL_PROGRESS';
ALTER TYPE "StepStatus" ADD VALUE IF NOT EXISTS 'NEEDS_GLOBAL_REVISION';
ALTER TYPE "StepStatus" ADD VALUE IF NOT EXISTS 'AWAITING_GLOBAL_REVIEW';

UPDATE "report_draft_steps" AS rds
SET "status" = CASE rds."status"::text
  WHEN 'IN_PROGRESS' THEN 'IN_GLOBAL_PROGRESS'::"StepStatus"
  WHEN 'AWAITING_REVIEW' THEN 'AWAITING_GLOBAL_REVIEW'::"StepStatus"
  WHEN 'NEEDS_REVISION' THEN 'NEEDS_GLOBAL_REVISION'::"StepStatus"
  ELSE rds."status"
END
FROM "report_drafts" AS rd
WHERE rd."id" = rds."report_draft_id"
  AND rd."aggregate_status" = 'UNDER_GLOBAL_REVIEW'
  AND rds."status"::text IN ('IN_PROGRESS', 'AWAITING_REVIEW', 'NEEDS_REVISION');
