-- Super-admin global revision marker (final validation workflow).
ALTER TABLE `report_drafts`
ADD COLUMN `super_admin_revision_requested_at` DATETIME(3) NULL;
