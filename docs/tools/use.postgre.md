# PostgreSQL (Docker)

## Image utilisée

Dans **`server/docker/compose.dev.yaml`** et **`server/docker/compose.prod.yml`**, le service **`postgres`** utilise l’image officielle :

**`postgres:18-alpine`**

- **PostgreSQL 18** : branche majeure actuelle (voir [Postgres sur Docker Hub](https://hub.docker.com/_/postgres)).
- **Alpine** : variante **légère** (moins de données à télécharger / stocker pour dev et déploiement).
- **Parité dev / prod** : même tag partout pour limiter les écarts de comportement entre environnements.

## Pourquoi Alpine (pour l’instant)

- Pulls et mises à jour plus rapides.
- Footprint disque réduit sur les machines de dev et les hôtes de prod.

Les conteneurs officiels **Alpine** restent adaptés à un usage **Postgres standard** (sans extension lourde packagée uniquement en Debian).

## Quand revoir ce choix

Passer à la variante **Debian** (ex. **`postgres:18`** ou **`postgres:18-bookworm`**) si :

- tu ajoutes des **extensions** (PostGIS, etc.) mal supportées ou absentes sur Alpine ;
- un outil ou un **binaire tiers** suppose **glibc** (image Debian) et échoue sur **musl** (Alpine) ;
- tu constates des **écarts** dev/prod ou des bugs difficiles à attribuer à la couche système.

Dans ce cas, changer uniquement la ligne **`image:`** du service **`postgres`** dans les deux fichiers Compose et aligner la doc / les déploiements.

## Où lancer Postgres dans ce projet

- Profil Compose **`pg`** : **`DATABASE_NAME=POSTGRESQL`** ou **`POSTGRESQL_PRISMA`**, ou **`--profile pg`** à la main (voir **`start.sh`**).
- **Migrations / Prisma** : **`server/README.md`** (section *PostgreSQL et Prisma*), puis **`server/docker/README.md`** (section *Prisma, migrations et démo*).
- Image, ports, variables : **`server/docker/README.md`** (PostgreSQL).
