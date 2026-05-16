-- Local-only demo account (super-admin). Do NOT run in production unless intended.
INSERT INTO `users` (`id`, `username`, `email`, `password_hash`)
VALUES (
  'demo-user',
  'Demo User',
  'demo-user@example.local',
  'f764cb4e98d68cc8eae3a76a679371d7:7dc132dc78ad1dffa69d9613e37653a31efb152c72e1d618884e35e965b0d34ab57edde9d70721d9dcaa2e4309d39f358699015bb6ae90b6d831f8b65c5758f9'
)
AS new
ON DUPLICATE KEY UPDATE
  `username` = new.`username`,
  `email` = new.`email`,
  `password_hash` = new.`password_hash`;

UPDATE `users`
SET `role_id` = 2
WHERE `id` = 'demo-user'
  AND EXISTS (SELECT 1 FROM `roles` WHERE `id` = 2 AND `name` = 'SUPER_ADMIN');
