-- CreateTable
CREATE TABLE `ip_access_settings` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `ip_whitelist_enabled` BOOLEAN NOT NULL DEFAULT false,
    `updated_at` DATETIME(3) NOT NULL,
    `updated_by_user_id` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `ip_access_settings` (`id`, `ip_whitelist_enabled`, `updated_at`)
VALUES (1, false, CURRENT_TIMESTAMP(3));

-- CreateTable
CREATE TABLE `ip_whitelist_entries` (
    `id` VARCHAR(191) NOT NULL,
    `cidr` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by_user_id` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `ip_whitelist_entries_cidr_key`(`cidr`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
