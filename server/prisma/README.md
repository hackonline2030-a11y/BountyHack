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

## Flux conseillé (dev MySQL + Docker)

Depuis `bugbountyapp/server/`, avec `DATABASE_NAME=MYSQL_PRISMA` dans `.env`  
(`DATABASE_URL` peut cibler `@mysql` pour l’API dans Docker ; les scripts `docker:prisma:*` réécrivent vers `127.0.0.1`).

**`docker compose` sans pnpm** (si `permission denied` sur le socket Docker, préfixer par `sudo`) :

```sh
# MySQL + Adminer
docker compose -f docker/compose.dev.yaml --profile mysql up -d mysql adminer

# Seed cycle report-draft (fichier lu sur l’hôte, exécuté dans le conteneur mysql)
docker compose -f docker/compose.dev.yaml --profile mysql exec -T mysql \
  mysql -ubugbountyapp -pbugbountyapp bugbountyapp \
  < prisma/seed/dev-report-draft-bucket-vault.mysql.sql
```

Voir aussi [`../README.md`](../README.md#mysql-prisma-et-seed-report-draft-docker).

**Via pnpm** (depuis `server/`) :

```bash
pnpm docker:mysql:up                      # MySQL + Adminer (http://localhost:8088)
pnpm docker:prisma:generate:mysql
pnpm docker:prisma:migrate:deploy:mysql   # schéma
pnpm docker:prisma:seed:mysql             # rôles + compte démo (non destructif)
pnpm docker:prisma:seed:dev-draft         # cycle report-draft complet (non destructif)
```

Sans les helpers Docker (`.env` avec `DATABASE_URL=mysql://…@127.0.0.1:3306/…`) :

```bash
pnpm prisma:generate:mysql
pnpm prisma:migrate:deploy:mysql
pnpm prisma:seed
pnpm prisma:seed:dev-draft
```

Migrations MySQL : `prisma/migrations-mysql/` (schéma : `schema.mysql.prisma`).  
**Ne pas** mélanger les dossiers `migrations/` (Postgres) et `migrations-mysql/` sur la même base.

### Dev MySQL : échec `20260524120000` (colonne `target_ref_scope` absente)

Si la base Docker locale a été créée avec l’ancien unique `COALESCE(target_ref_id)` (sans colonne `target_ref_scope`) et que `prisma migrate deploy` échoue avec **1054 Unknown column 'target_ref_scope'** :

```bash
cd bugbountyapp/server
chmod +x scripts/dev-mysql-repair-quality-distributions.sh
DATABASE_NAME=MYSQL_PRISMA ./scripts/dev-mysql-repair-quality-distributions.sh
```

Le script aligne la table sur le schéma actuel **sans supprimer** les données qualité, puis marque la migration comme appliquée. La prod (déjà à jour) n’a pas besoin de ce script.

Production : décider si vous exécutez les seeds SQL une fois après déploiement, et **`SEED_DEMO_USER=false`** (recommandé) pour éviter tout compte démo.
