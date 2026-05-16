-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `password_hash` VARCHAR(191) NULL,
    `two_factor_enabled` BIGINT NOT NULL DEFAULT 0,
    `role_id` INTEGER NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_role_id_idx`(`role_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `roles_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `objects` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `objects_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permissions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `action` VARCHAR(191) NOT NULL,
    `object_id` INTEGER NOT NULL,

    INDEX `permissions_object_id_idx`(`object_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role_permissions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `role_id` INTEGER NOT NULL,
    `permission_id` INTEGER NOT NULL,

    INDEX `role_permissions_role_id_idx`(`role_id`),
    INDEX `role_permissions_permission_id_idx`(`permission_id`),
    UNIQUE INDEX `role_permissions_role_id_permission_id_key`(`role_id`, `permission_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `token_hash` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `last_used_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `refresh_tokens_token_hash_key`(`token_hash`),
    INDEX `refresh_tokens_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `password_reset_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `token_hash` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `password_reset_tokens_token_hash_key`(`token_hash`),
    INDEX `password_reset_tokens_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `two_factor` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `method` ENUM('APP') NOT NULL,
    `verified` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `two_factor_user_id_idx`(`user_id`),
    UNIQUE INDEX `two_factor_user_id_method_key`(`user_id`, `method`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `two_factor_totp` (
    `id` VARCHAR(191) NOT NULL,
    `two_factor_id` VARCHAR(191) NOT NULL,
    `secret` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `two_factor_totp_two_factor_id_key`(`two_factor_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `report_drafts` (
    `id` VARCHAR(191) NOT NULL,
    `hunter_id` VARCHAR(191) NOT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `aggregate_status` ENUM('DRAFT', 'UNDER_REVIEW', 'READY_TO_PROGRAM', 'SUBMITTED_TO_PROGRAM', 'GIVEN_UP', 'REJECTED') NOT NULL DEFAULT 'DRAFT',
    `pending_report_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `report_drafts_pending_report_id_key`(`pending_report_id`),
    INDEX `report_drafts_hunter_id_idx`(`hunter_id`),
    INDEX `report_drafts_aggregate_status_idx`(`aggregate_status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `report_draft_steps` (
    `id` VARCHAR(191) NOT NULL,
    `report_draft_id` VARCHAR(191) NOT NULL,
    `step` ENUM('META', 'DESCRIPTION', 'COLLECTION', 'EXPLOITATION', 'PROOF_OF_CONCEPT', 'RISKS', 'REMEDIATION', 'FINAL') NOT NULL,
    `payload` JSON NOT NULL,
    `status` ENUM('IN_PROGRESS', 'AWAITING_REVIEW', 'NEEDS_REVISION', 'APPROVED') NOT NULL DEFAULT 'IN_PROGRESS',
    `current_round` INTEGER NOT NULL DEFAULT 0,
    `assigned_reviewer_role` ENUM('HUNTER', 'MENTOR', 'QUALITY_CHECKER', 'SUPER_ADMIN') NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `report_draft_steps_report_draft_id_idx`(`report_draft_id`),
    UNIQUE INDEX `report_draft_steps_report_draft_id_step_key`(`report_draft_id`, `step`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `report_draft_attachments` (
    `id` VARCHAR(191) NOT NULL,
    `report_draft_step_id` VARCHAR(191) NOT NULL,
    `filename` VARCHAR(191) NOT NULL,
    `mime_type` VARCHAR(191) NOT NULL,
    `size_bytes` INTEGER NOT NULL,
    `storage_key` VARCHAR(191) NOT NULL,
    `thumbnail_url` VARCHAR(191) NULL,
    `uploaded_by` VARCHAR(191) NOT NULL,
    `uploaded_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `report_draft_attachments_report_draft_step_id_idx`(`report_draft_step_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `submissions` (
    `id` VARCHAR(191) NOT NULL,
    `report_draft_step_id` VARCHAR(191) NOT NULL,
    `report_draft_id` VARCHAR(191) NOT NULL,
    `step` ENUM('META', 'DESCRIPTION', 'COLLECTION', 'EXPLOITATION', 'PROOF_OF_CONCEPT', 'RISKS', 'REMEDIATION', 'FINAL') NOT NULL,
    `round` INTEGER NOT NULL,
    `submission_kind` ENUM('HUNTER_TO_REVIEWER', 'HUNTER_TO_MENTOR', 'MENTOR_TO_QC', 'QC_TO_MENTOR', 'QC_TO_SUPER_ADMIN') NOT NULL DEFAULT 'HUNTER_TO_REVIEWER',
    `payload` JSON NOT NULL,
    `submitted_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `submitted_by` VARCHAR(191) NOT NULL,
    `reviewer_role` ENUM('HUNTER', 'MENTOR', 'QUALITY_CHECKER', 'SUPER_ADMIN') NOT NULL,
    `decision` ENUM('PENDING', 'APPROVE', 'REQUEST_CHANGES', 'ENDORSE') NOT NULL DEFAULT 'PENDING',
    `decided_at` DATETIME(3) NULL,
    `decided_by` VARCHAR(191) NULL,

    INDEX `submissions_report_draft_id_idx`(`report_draft_id`),
    INDEX `submissions_reviewer_role_decision_idx`(`reviewer_role`, `decision`),
    UNIQUE INDEX `submissions_report_draft_step_id_round_reviewer_role_submiss_key`(`report_draft_step_id`, `round`, `reviewer_role`, `submission_kind`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reviewer_comments` (
    `id` VARCHAR(191) NOT NULL,
    `submission_id` VARCHAR(191) NOT NULL,
    `author_id` VARCHAR(191) NOT NULL,
    `author_role` ENUM('HUNTER', 'MENTOR', 'QUALITY_CHECKER', 'SUPER_ADMIN') NOT NULL,
    `anchor` JSON NULL,
    `body` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `resolved_at` DATETIME(3) NULL,

    INDEX `reviewer_comments_submission_id_idx`(`submission_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `submission_attachment_snapshots` (
    `id` VARCHAR(191) NOT NULL,
    `submission_id` VARCHAR(191) NOT NULL,
    `filename` VARCHAR(191) NOT NULL,
    `mime_type` VARCHAR(191) NOT NULL,
    `size_bytes` INTEGER NOT NULL,
    `storage_key` VARCHAR(191) NOT NULL,
    `thumbnail_url` VARCHAR(191) NULL,
    `uploaded_at` DATETIME(3) NOT NULL,
    `uploaded_by` VARCHAR(191) NOT NULL,

    INDEX `submission_attachment_snapshots_submission_id_idx`(`submission_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `submission_content_snapshots` (
    `id` VARCHAR(191) NOT NULL,
    `submission_id` VARCHAR(191) NOT NULL,
    `payload` JSON NOT NULL,
    `captured_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `submission_content_snapshots_submission_id_idx`(`submission_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reports` (
    `id` VARCHAR(191) NOT NULL,
    `hunter_id` VARCHAR(191) NOT NULL,
    `source_draft_id` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'PUBLISHED') NOT NULL DEFAULT 'PENDING',
    `frozen_content` JSON NULL,
    `content_synced_at` DATETIME(3) NULL,
    `promoted_by` VARCHAR(191) NULL,
    `published_by` VARCHAR(191) NULL,
    `published_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `reports_source_draft_id_key`(`source_draft_id`),
    INDEX `reports_hunter_id_idx`(`hunter_id`),
    INDEX `reports_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `report_draft_teams` (
    `id` VARCHAR(191) NOT NULL,
    `report_draft_id` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `report_draft_teams_report_draft_id_key`(`report_draft_id`),
    INDEX `report_draft_teams_report_draft_id_idx`(`report_draft_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `report_team_members` (
    `id` VARCHAR(191) NOT NULL,
    `team_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `role` ENUM('HUNTER', 'QUALITY_CHECKER', 'MENTOR') NOT NULL,
    `joined_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `report_team_members_team_id_idx`(`team_id`),
    INDEX `report_team_members_user_id_idx`(`user_id`),
    UNIQUE INDEX `report_team_members_team_id_user_id_key`(`team_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `report_team_join_requests` (
    `id` VARCHAR(191) NOT NULL,
    `team_id` VARCHAR(191) NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `requested_role` ENUM('HUNTER', 'QUALITY_CHECKER', 'MENTOR') NOT NULL,
    `message` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `requested_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `decided_at` DATETIME(3) NULL,
    `decided_by_id` VARCHAR(191) NULL,

    INDEX `report_team_join_requests_team_id_status_idx`(`team_id`, `status`),
    INDEX `report_team_join_requests_user_id_status_idx`(`user_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `permissions` ADD CONSTRAINT `permissions_object_id_fkey` FOREIGN KEY (`object_id`) REFERENCES `objects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_permission_id_fkey` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `password_reset_tokens` ADD CONSTRAINT `password_reset_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `two_factor` ADD CONSTRAINT `two_factor_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `two_factor_totp` ADD CONSTRAINT `two_factor_totp_two_factor_id_fkey` FOREIGN KEY (`two_factor_id`) REFERENCES `two_factor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_drafts` ADD CONSTRAINT `report_drafts_hunter_id_fkey` FOREIGN KEY (`hunter_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_drafts` ADD CONSTRAINT `report_drafts_pending_report_id_fkey` FOREIGN KEY (`pending_report_id`) REFERENCES `reports`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_draft_steps` ADD CONSTRAINT `report_draft_steps_report_draft_id_fkey` FOREIGN KEY (`report_draft_id`) REFERENCES `report_drafts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_draft_attachments` ADD CONSTRAINT `report_draft_attachments_report_draft_step_id_fkey` FOREIGN KEY (`report_draft_step_id`) REFERENCES `report_draft_steps`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `submissions` ADD CONSTRAINT `submissions_report_draft_step_id_fkey` FOREIGN KEY (`report_draft_step_id`) REFERENCES `report_draft_steps`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `submissions` ADD CONSTRAINT `submissions_report_draft_id_fkey` FOREIGN KEY (`report_draft_id`) REFERENCES `report_drafts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviewer_comments` ADD CONSTRAINT `reviewer_comments_submission_id_fkey` FOREIGN KEY (`submission_id`) REFERENCES `submissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `submission_attachment_snapshots` ADD CONSTRAINT `submission_attachment_snapshots_submission_id_fkey` FOREIGN KEY (`submission_id`) REFERENCES `submissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `submission_content_snapshots` ADD CONSTRAINT `submission_content_snapshots_submission_id_fkey` FOREIGN KEY (`submission_id`) REFERENCES `submissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_hunter_id_fkey` FOREIGN KEY (`hunter_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_draft_teams` ADD CONSTRAINT `report_draft_teams_report_draft_id_fkey` FOREIGN KEY (`report_draft_id`) REFERENCES `report_drafts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_team_members` ADD CONSTRAINT `report_team_members_team_id_fkey` FOREIGN KEY (`team_id`) REFERENCES `report_draft_teams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_team_members` ADD CONSTRAINT `report_team_members_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_team_join_requests` ADD CONSTRAINT `report_team_join_requests_team_id_fkey` FOREIGN KEY (`team_id`) REFERENCES `report_draft_teams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_team_join_requests` ADD CONSTRAINT `report_team_join_requests_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_team_join_requests` ADD CONSTRAINT `report_team_join_requests_decided_by_id_fkey` FOREIGN KEY (`decided_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
