-- Dev / bootstrap: application roles (`AppRoleCode`). Idempotent (MySQL / MariaDB).
-- Non destructif : crée chaque rôle uniquement si l’id n’existe pas encore (pas de mise à jour du nom).
INSERT IGNORE INTO `roles` (`id`, `name`) VALUES
  (1, 'USER'),
  (2, 'SUPER_ADMIN'),
  (3, 'HUNTER'),
  (4, 'MENTOR'),
  (5, 'QUALITY_CHECKER'),
  (6, 'COORDINATOR'),
  (7, 'QUALITY_CONTENT');

SET @max_role_id = (SELECT COALESCE(MAX(`id`), 1) FROM `roles`);
SET @sql = CONCAT('ALTER TABLE `roles` AUTO_INCREMENT = ', @max_role_id + 1);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
