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
# DATABASE_NAME=POSTGRESQL_PRISMA (défaut dans prisma.config.ts)
pnpm prisma:generate
pnpm prisma:migrate:deploy
pnpm prisma:seed
```

## Flux conseillé (dev MySQL)

```bash
cd bugbountyapp/server
# Dans .env : DATABASE_NAME=MYSQL_PRISMA et DATABASE_URL=mysql://...
pnpm docker:mysql:up   # optionnel — MySQL + Adminer
pnpm prisma:generate:mysql
pnpm prisma:migrate:deploy:mysql
pnpm prisma:seed       # utilise roles.mysql.sql / demo.mysql.sql
```

Migrations MySQL : `prisma/migrations-mysql/` (schéma : `schema.mysql.prisma`).  
**Ne pas** mélanger les dossiers `migrations/` (Postgres) et `migrations-mysql/` sur la même base.

Production : décider si vous exécutez les seeds SQL une fois après déploiement, et **`SEED_DEMO_USER=false`** (recommandé) pour éviter tout compte démo.
