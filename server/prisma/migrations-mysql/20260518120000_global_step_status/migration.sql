-- Global revision step statuses (parallel to per-step QC workflow).
ALTER TABLE `report_draft_steps`
MODIFY `status` ENUM(
  'IN_PROGRESS',
  'AWAITING_REVIEW',
  'NEEDS_REVISION',
  'APPROVED',
  'IN_GLOBAL_PROGRESS',
  'NEEDS_GLOBAL_REVISION',
  'AWAITING_GLOBAL_REVIEW'
) NOT NULL DEFAULT 'IN_PROGRESS';

UPDATE `report_draft_steps` AS rds
INNER JOIN `report_drafts` AS rd ON rd.`id` = rds.`report_draft_id`
SET rds.`status` = CASE rds.`status`
  WHEN 'IN_PROGRESS' THEN 'IN_GLOBAL_PROGRESS'
  WHEN 'AWAITING_REVIEW' THEN 'AWAITING_GLOBAL_REVIEW'
  WHEN 'NEEDS_REVISION' THEN 'NEEDS_GLOBAL_REVISION'
  ELSE rds.`status`
END
WHERE rd.`aggregate_status` = 'UNDER_GLOBAL_REVIEW'
  AND rds.`status` IN ('IN_PROGRESS', 'AWAITING_REVIEW', 'NEEDS_REVISION');
