-- Legacy `reports` + `report_drafts.pending_report_id` are unused: published drafts are the PDF source of truth.

ALTER TABLE `report_drafts` DROP FOREIGN KEY `report_drafts_pending_report_id_fkey`;

ALTER TABLE `report_drafts` DROP INDEX `report_drafts_pending_report_id_key`;

ALTER TABLE `report_drafts` DROP COLUMN `pending_report_id`;

DROP TABLE IF EXISTS `reports`;
