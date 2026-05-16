-- Dev / bootstrap: application roles (`AppRoleCode`). Idempotent (MySQL / MariaDB).
-- Uses VALUES() in ON DUPLICATE KEY UPDATE (compatible MariaDB < 10.5 alias syntax).
INSERT INTO `roles` (`id`, `name`) VALUES
  (1, 'USER'),
  (2, 'SUPER_ADMIN'),
  (3, 'HUNTER'),
  (4, 'MENTOR'),
  (5, 'QUALITY_CHECKER'),
  (6, 'COORDINATOR'),
  (7, 'QUALITY_CONTENT')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

SET @max_role_id = (SELECT COALESCE(MAX(`id`), 1) FROM `roles`);
SET @sql = CONCAT('ALTER TABLE `roles` AUTO_INCREMENT = ', @max_role_id + 1);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
