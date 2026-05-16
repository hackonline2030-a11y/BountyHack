-- Faux utilisateur de démo — colonnes alignées sur prisma/schema.prisma (table `users`) et
-- prisma/migrations/*_init_users. Même identité que docker/dump/user.json (Mongo).
-- Réimport : ./start.sh dump-users-pg (depuis server/docker/) avec profil Postgres actif.

INSERT INTO "users" ("id", "username", "email", "password_hash")
VALUES (
  'demo-user',
  'Demo User',
  'demo-user@example.local',
  'f764cb4e98d68cc8eae3a76a679371d7:7dc132dc78ad1dffa69d9613e37653a31efb152c72e1d618884e35e965b0d34ab57edde9d70721d9dcaa2e4309d39f358699015bb6ae90b6d831f8b65c5758f9'
)
ON CONFLICT ("id") DO UPDATE SET
  "username" = EXCLUDED."username",
  "email" = EXCLUDED."email",
  "password_hash" = EXCLUDED."password_hash";
