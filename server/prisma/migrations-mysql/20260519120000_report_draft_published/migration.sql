-- Published report drafts are the PDF source of truth (no separate reports snapshot required).
ALTER TABLE `report_drafts`
MODIFY `aggregate_status` ENUM(
  'DRAFT',
  'UNDER_REVIEW',
  'UNDER_GLOBAL_REVIEW',
  'READY_TO_PROGRAM',
  'SUBMITTED_TO_PROGRAM',
  'PUBLISHED',
  'GIVEN_UP',
  'REJECTED'
) NOT NULL DEFAULT 'DRAFT';

UPDATE `report_drafts`
SET `aggregate_status` = 'PUBLISHED'
WHERE `aggregate_status` = 'SUBMITTED_TO_PROGRAM';
