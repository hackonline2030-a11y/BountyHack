-- DropForeignKey
ALTER TABLE `global_reviewer_comments` DROP FOREIGN KEY `grc_global_submission_id_fkey`;

-- DropForeignKey
ALTER TABLE `global_submissions` DROP FOREIGN KEY `gs_report_draft_id_fkey`;

-- AlterTable
ALTER TABLE `global_reviewer_comments` MODIFY `body` VARCHAR(191) NOT NULL;

-- DropTable
DROP TABLE `ip_access_settings`;

-- DropTable
DROP TABLE `ip_whitelist_entries`;

-- CreateTable
CREATE TABLE `user_events` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `event_type` VARCHAR(191) NOT NULL,
    `old_value` VARCHAR(191) NULL,
    `new_value` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `user_events_user_id_idx`(`user_id`),
    INDEX `user_events_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `global_submissions` ADD CONSTRAINT `global_submissions_report_draft_id_fkey` FOREIGN KEY (`report_draft_id`) REFERENCES `report_drafts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `global_reviewer_comments` ADD CONSTRAINT `global_reviewer_comments_global_submission_id_fkey` FOREIGN KEY (`global_submission_id`) REFERENCES `global_submissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_events` ADD CONSTRAINT `user_events_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

