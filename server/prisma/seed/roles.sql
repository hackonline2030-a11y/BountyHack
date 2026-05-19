-- Dev / bootstrap: application roles (`AppRoleCode`). Idempotent.
-- Non destructif : crée chaque rôle uniquement si l’id n’existe pas encore (pas de mise à jour du nom).
-- Safe to reject in prod if you populate roles differently — then skip this file.
INSERT INTO "roles" ("id", "name") VALUES
  (1, 'USER'),
  (2, 'SUPER_ADMIN'),
  (3, 'HUNTER'),
  (4, 'MENTOR'),
  (5, 'QUALITY_CHECKER'),
  (6, 'COORDINATOR'),
  (7, 'QUALITY_CONTENT')
ON CONFLICT ("id") DO NOTHING;

SELECT setval(
  pg_get_serial_sequence('"roles"', 'id'),
  (SELECT COALESCE(MAX("id"), 1) FROM "roles")
);
