# Prisma (`bugbountyapp/server`)

## Migrations vs seed

| Outil | Rôle |
|--------|------|
| `pnpm prisma:migrate:dev` | Schéma + nouvelles migrations (dev). |
| `pnpm prisma:migrate:deploy` | **DDL uniquement** — applique les dossiers sous `prisma/migrations/` (sans données métier depuis la refonte ci-dessous). |
| `pnpm prisma:seed` | **Données** idempotentes dans `prisma/seed/*.sql`, exécutées via `prisma/seed-runner.mjs`. |

Les migrations ayant encore le préfixe `seed_*` dans le dossier ont un `migration.sql` réduit à un no-op : leur **somme de contrôle** change si ces fichiers ont déjà été appliqués sur ta machine avec l’ancien SQL.

Si `prisma migrate deploy` émet une erreur de **checksum sur une ancienne migration** :

- En **local** : repartir avec `pnpm exec prisma migrate reset` (⚠️ efface les données), puis `deploy` + `pnpm prisma:seed`, **ou**
- Suivre la doc Prisma (`migrate resolve`) pour votre cas précis — et éviter désormais d’éditer des migrations déjà déployées en prod sans procédure de baseline.

## Variables

| Variable | Effet |
|----------|--------|
| `SEED_DEMO_USER` | Si `false`, le runner n’exécute **pas** `prisma/seed/demo.sql` (pas de user démo ni super-admin sur ce compte). Les **rôles** (`roles.sql`) sont toujours insérés. |

## Flux conseillé (dev Postgres)

```bash
cd bugbountyapp/server
pnpm prisma:generate
pnpm prisma:migrate:deploy
pnpm prisma:seed
```

Production : décider si vous exécutez `roles.sql` une fois après déploiement, et **`SEED_DEMO_USER=false`** (recommandé) pour éviter tout compte démo.
