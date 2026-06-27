-- Persisted reallow entries (blacklist bypass, independent of whitelist-only mode).
CREATE TABLE `ip_reallow_entries` (
    `id` VARCHAR(191) NOT NULL,
    `cidr` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by_user_id` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `ip_reallow_entries_cidr_key`(`cidr`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
