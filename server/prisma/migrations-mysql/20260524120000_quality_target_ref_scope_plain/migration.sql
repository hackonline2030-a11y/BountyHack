-- Interim VPS migration used a GENERATED `target_ref_scope`; the app now sets this column in code.
-- Convert to a plain column (no-op if already plain from 20260522120000_quality_criteria).
ALTER TABLE `quality_criterion_distributions`
  MODIFY `target_ref_scope` VARCHAR(191) NOT NULL DEFAULT '';

UPDATE `quality_criterion_distributions`
SET `target_ref_scope` = IFNULL(`target_ref_id`, '')
WHERE `target_ref_scope` = '' OR `target_ref_id` IS NOT NULL;
