-- AlterTable (MySQL enum extension)
ALTER TABLE `report_drafts`
MODIFY `aggregate_status` ENUM(
  'DRAFT',
  'UNDER_REVIEW',
  'UNDER_GLOBAL_REVIEW',
  'READY_TO_PROGRAM',
  'SUBMITTED_TO_PROGRAM',
  'GIVEN_UP',
  'REJECTED'
) NOT NULL DEFAULT 'DRAFT';

CREATE TABLE `global_submissions` (
    `id` VARCHAR(191) NOT NULL,
    `report_draft_id` VARCHAR(191) NOT NULL,
    `revision_number` INTEGER NOT NULL,
    `payload` JSON NOT NULL,
    `submitted_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `submitted_by` VARCHAR(191) NOT NULL,
    `reviewer_role` ENUM('HUNTER', 'MENTOR', 'QUALITY_CHECKER', 'SUPER_ADMIN') NOT NULL,
    `decision` ENUM('PENDING', 'APPROVE', 'REQUEST_CHANGES', 'ENDORSE') NOT NULL DEFAULT 'PENDING',
    `decided_at` DATETIME(3) NULL,
    `decided_by` VARCHAR(191) NULL,

    UNIQUE INDEX `gs_draft_rev_role_uq`(`report_draft_id`, `revision_number`, `reviewer_role`),
    INDEX `gs_report_draft_id_idx`(`report_draft_id`),
    INDEX `gs_reviewer_decision_idx`(`reviewer_role`, `decision`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `global_reviewer_comments` (
    `id` VARCHAR(191) NOT NULL,
    `global_submission_id` VARCHAR(191) NOT NULL,
    `author_id` VARCHAR(191) NOT NULL,
    `author_role` ENUM('HUNTER', 'MENTOR', 'QUALITY_CHECKER', 'SUPER_ADMIN') NOT NULL,
    `anchor` JSON NULL,
    `body` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `resolved_at` DATETIME(3) NULL,

    INDEX `grc_global_submission_id_idx`(`global_submission_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `global_submissions`
ADD CONSTRAINT `gs_report_draft_id_fkey`
FOREIGN KEY (`report_draft_id`) REFERENCES `report_drafts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `global_reviewer_comments`
ADD CONSTRAINT `grc_global_submission_id_fkey`
FOREIGN KEY (`global_submission_id`) REFERENCES `global_submissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

UPDATE `report_drafts`
SET `aggregate_status` = 'UNDER_GLOBAL_REVIEW'
WHERE `super_admin_revision_requested_at` IS NOT NULL
  AND `aggregate_status` = 'UNDER_REVIEW';
