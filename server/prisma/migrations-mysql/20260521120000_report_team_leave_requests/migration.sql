-- CreateTable
CREATE TABLE `report_team_leave_requests` (
    `id` VARCHAR(191) NOT NULL,
    `team_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `requested_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `decided_at` DATETIME(3) NULL,
    `decided_by_id` VARCHAR(191) NULL,

    INDEX `report_team_leave_requests_team_id_status_idx`(`team_id`, `status`),
    INDEX `report_team_leave_requests_user_id_status_idx`(`user_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `report_team_leave_requests` ADD CONSTRAINT `report_team_leave_requests_team_id_fkey` FOREIGN KEY (`team_id`) REFERENCES `report_draft_teams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_team_leave_requests` ADD CONSTRAINT `report_team_leave_requests_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_team_leave_requests` ADD CONSTRAINT `report_team_leave_requests_decided_by_id_fkey` FOREIGN KEY (`decided_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
