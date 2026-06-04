-- Local-only demo accounts (super-admin). Do NOT run in production unless intended.
--
-- demo-user@example.local — password from existing demo seed hash (unchanged).
-- admin@example.com — Jéremy / password (scrypt, fixed salt for reproducible seed).

INSERT INTO `users` (`id`, `username`, `email`, `password_hash`)
VALUES (
  'demo-user',
  'Demo User',
  'demo-user@example.local',
  'f764cb4e98d68cc8eae3a76a679371d7:7dc132dc78ad1dffa69d9613e37653a31efb152c72e1d618884e35e965b0d34ab57edde9d70721d9dcaa2e4309d39f358699015bb6ae90b6d831f8b65c5758f9'
)
ON DUPLICATE KEY UPDATE
  `username` = VALUES(`username`),
  `email` = VALUES(`email`),
  `password_hash` = VALUES(`password_hash`);

INSERT INTO `users` (`id`, `username`, `email`, `password_hash`)
VALUES (
  'local-admin-jeremy',
  'Jéremy',
  'admin@example.com',
  'seedadminlocal0000000000000001:978ee4be802dae139294bd6e018208e45a7335f8194cd39a0335a6039afb9ef5a245d5cc5be53dad5b55fd0966cb2c749437977ff2f867f519f4b072552f7d45'
)
ON DUPLICATE KEY UPDATE
  `username` = VALUES(`username`),
  `email` = VALUES(`email`),
  `password_hash` = VALUES(`password_hash`);

UPDATE `users`
SET `role_id` = 2
WHERE `id` IN ('demo-user', 'local-admin-jeremy')
  AND EXISTS (SELECT 1 FROM `roles` WHERE `id` = 2 AND `name` = 'SUPER_ADMIN');
