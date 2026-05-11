# Web API

API NestJS (auth, users, ping) — workspace [Nx](https://nx.dev).

*English version : [Go to english version](./README.en.md)*

## Installation

Crée le fichier **`server/.env`** à partir du modèle (tu peux rester à la **racine du monorepo**) :

```bash
# à la racine du dépôt (si pas encore fait)
cp server/.env.example server/.env
```

Équivalent si tu es déjà dans le dossier **`server/`** :

```sh
cp .env.example .env
```

Puis édite **`server/.env`** en suivant les commentaires de **`.env.example`** (secrets, `DATABASE_NAME`, `DATABASE_URL`, CORS, etc.).

---

## Prérequis

- **Node.js** 24+ et **pnpm** (voir `server/package.json` → `engines`)
- **Docker** et Docker Compose (uniquement si tu suis la procédure Docker ci-dessous)

### Workspace Nx : logique IDE et logique console

Résumé rapide :
- Certes, tu peux techniquement démarrer et travailler sur l'app sans utiliser Nx directement.
- Mais pour du travail en équipe, il est fortement recommandé d'utiliser Nx comme point d'entrée commun (mêmes commandes, même logique, moins d'écarts entre devs/CI).
- Sans Nx, ce n'est pas bloquant, mais le partage devient plus fragile ("ça marche chez moi", scripts exécutés différemment, oublis de cibles).

Le dossier `server/` est un **workspace Nx**.  
Un workspace Nx centralise :
- les projets (ex: `web-api`, `e2e`)
- leurs targets (`serve`, `build`, `test`, `lint`, ...)
- leurs dépendances

Conséquence : tu peux exécuter les mêmes actions soit depuis l'IDE, soit depuis la console.

#### 1) Logique IDE (VS Code / Cursor / JetBrains)

Pour piloter Nx visuellement, installe **Nx Console**.

- **VS Code**
  - Ouvre l'onglet Extensions.
  - Installe **Nx Console** (éditeur : `Nrwl`).
  - Recharge la fenêtre si demandé.

- **Cursor**
  - Cursor utilise les extensions VS Code.
  - Installe **Nx Console** (éditeur : `Nrwl`) depuis le Marketplace.
  - Recharge la fenêtre.

- **JetBrains** (WebStorm / IntelliJ IDEA / PhpStorm)
  - Ouvre `Settings > Plugins > Marketplace`.
  - Installe **Nx Console**.
  - Redémarre l'IDE.

Dans l'IDE, tu verras les projets Nx et tu pourras lancer directement les targets (`serve`, `build`, `test`) sans écrire toute la commande.

#### 2) Logique console (CLI Nx)

Si tu préfères le terminal, tout se fait depuis `server/` :

```sh
pnpm exec nx --version
pnpm exec nx show projects
pnpm exec nx show project web-api
pnpm exec nx serve web-api
pnpm exec nx build web-api
pnpm exec nx test web-api
```

En résumé : **IDE = confort visuel**, **console = contrôle explicite**.  
Les deux utilisent la même source de vérité Nx du workspace.

### Authentification et base de données

Les variables **`AUTH_TYPE`** et **`DATABASE_NAME`** se combinent. Point important :

- L'architecture auth est extensible via `AUTH_TYPE`, mais l'implémentation active est **`PASSPORT_JWT`**.
- Les options de base de donnees restent multiples via `DATABASE_NAME` (`MONGODB`, `POSTGRESQL_PRISMA`, `IN-MEMORY`).
- Avec **`DATABASE_NAME=MONGODB`**, les utilisateurs (email, hash de mot de passe, profil) sont stockés dans la base Mongo définie par **`DATABASE_URL`**.
- **2FA (schema et prochaines fonctionnalites)** : le projet ne fait evoluer cette couche que sous **`DATABASE_NAME=POSTGRESQL_PRISMA`** (migrations Prisma sur la base PostgreSQL). Pas d'extension parallele sur Mongo ou in-memory pour la 2FA pour l'instant ; voir **`src/auth/README.md`**.

Voir aussi les commentaires dans **`.env.example`**.

#### Configuration `AUTH_TYPE` et fichier `auth-env.ts`

La configuration d'authentification est centralisee dans **`src/auth/config/auth-env.ts`**.

- Ce fichier lit et normalise les variables d'environnement (`AUTH_TYPE`, `DATABASE_NAME`).
- Il centralise les choix de configuration auth/database pour eviter des checks disperses dans les modules Nest.

Valeur prise en charge pour **`AUTH_TYPE`** :

- `PASSPORT_JWT` : flux JWT via Passport/Nest (`passport-jwt`).

Recommandation : toute nouvelle condition liee a la configuration d'authentification doit passer par **`auth-env.ts`** plutot que des checks directs sur `process.env.AUTH_TYPE`.

---

## Démarrage

Choisis **un** parcours : **Docker** (API et optionnellement Postgres + watch), ou **Node sur l’hôte** avec une base joignable (**PostgreSQL + Prisma**, MongoDB, etc. selon **`DATABASE_NAME`**).

### API locale + DB Docker (recommandé en dev)

Pour itérer vite sur l'API, tu peux faire tourner :

- l'API NestJS en local sur ta machine (hot reload plus rapide, debug IDE plus simple),
- la base PostgreSQL dans Docker,
- pgweb dans Docker pour visualiser les tables.

Depuis `server/` :

1. Démarrer uniquement PostgreSQL + pgweb :

   ```sh
   pnpm run docker:postgre
   ```

2. Configurer `server/.env` pour exécuter l'API **hors Docker** :

   - `DATABASE_NAME=POSTGRESQL_PRISMA`
   - `DATABASE_URL=postgres://bugbountyapp:bugbountyapp@localhost:5432/bugbountyapp`

   Important : en mode API locale, utilise `localhost` (pas `postgres`, qui est le hostname interne Docker).

3. Appliquer Prisma depuis l'hôte :

   ```sh
   pnpm run prisma:generate
   pnpm run prisma:migrate:deploy
   ```

4. Lancer l'API en local :

   ```sh
   pnpm run start
   ```

5. Ouvrir pgweb :

   - `http://localhost:8087` (ou `PGWEB_HOST_PORT` si surchargé dans `.env`).

Arrêt de la stack PostgreSQL seule :

```sh
pnpm run docker:postgre:stop
```

Ou teardown complet (profil pg) :

```sh
pnpm run docker:postgre:down
```

### PostgreSQL et Prisma

Persistance **`users`** avec **Prisma** : **`DATABASE_NAME=POSTGRESQL_PRISMA`**. Commandes depuis **`server/`** (après `pnpm install` à la racine du monorepo).

| Contexte | Commandes |
|----------|-----------|
| **Docker — API en watch** (`web-api-watch` + Postgres) | `pnpm docker:watch`, puis `pnpm docker:prisma:generate`, `pnpm docker:prisma:deploy`, puis données : `pnpm docker:prisma:seed` (rôles + démo optionnelle). Équivalent : `./docker/start.sh watch-up` depuis **`server/docker/`**. |
| **Node sur l’hôte — Postgres sur `localhost`** | `pnpm prisma generate`, `pnpm prisma migrate deploy`, puis `pnpm prisma:seed`. Si `DATABASE_URL` contient encore `@postgres` : `pnpm prisma:migrate:deploy:docker` puis `pnpm prisma:seed:docker`. Voir **`prisma/README.md`** (migrations = schéma ; seed = données). |

Plus de détail : [`docker/README.md`](docker/README.md#prisma-migrations-et-démo), **`.env.example`**.

**Démo login** : `demo-user@example.local` / `password123` (Postgres seed ou import Mongo).

### 1. Avec Docker

Guide détaillé (installation Docker, `start.sh`, équivalents `docker compose` bruts) : [`docker/README.md`](docker/README.md).

Construit et exécute toujours l’**API** à partir de `docker/Dockerfile`, via `docker/compose.dev.yaml`.

**PostgreSQL + pgweb** sont démarrés si **`DATABASE_NAME=POSTGRESQL_PRISMA`** dans **`server/.env`** (voir `.env.example`). **MongoDB + mongo-express** le sont si `DATABASE_NAME=MONGODB`. Avec `IN-MEMORY`, les services de base Docker concernés ne sont pas lancés. Les **profils** Compose (`mongodb`, `pg`) séparent ces jeux de conteneurs.

1. Fichier d’environnement : comme indiqué en **[Installation](#installation)** (`server/.env` depuis `server/.env.example`). Renseigne `DATABASE_NAME` selon ton backend (`MONGODB`, `POSTGRESQL_PRISMA`, `IN-MEMORY`, …), ainsi que `JWT_SECRET`, CORS, etc.

   **`DATABASE_URL` :** `.env.example` part sur **PostgreSQL** (ex. `postgres://…@postgres:5432/…` pour l’API dans Docker). **API dans Docker** + profil **pg** : hôte **`postgres`** sur le réseau Compose (pas `localhost` depuis le conteneur). **API sur l’hôte** (`nx serve`) + Postgres dans Docker : URL vers **`localhost`** (ou `127.0.0.1`) et le port **`POSTGRES_HOST_PORT`**. Pour **Mongo** : voir `.env.example` ; dans Docker, hôte **`mongodb`** (ex. `mongodb://mongodb:27017/bugbountyapp`).

2. Lancement :

   ```sh
   ./docker/start.sh
   ```

   Raccourci équivalent : `./docker/start` (même script).

   **Arrêt :** `./docker/start.sh down` — arrête **tout** (API classique, **api-watch**, Mongo, mongo-express, Postgres, pgweb selon les profils utilisés), supprime le réseau et les orphelins (`--remove-orphans`). Avant, un `down` sans le profil `watch` pouvait laisser `web-api-watch` actif et le réseau « in use ». Volumes (Mongo, Postgres, `web_api_node_modules`, …) : `./docker/start.sh down -v`.

   **Cycle rapide API (sans rebuild image) :**
   - `./docker/start.sh api-restart` (ou `./docker/start.sh restart-api`) : redémarre l’API sans reconstruire l’image.
   - `./docker/start.sh api-stop` (ou `./docker/start.sh stop-api`) : arrête l’API et, selon **`DATABASE_NAME`**, la base Docker associée (**MongoDB** si `MONGODB`, **Postgres + pgweb** si **`POSTGRESQL_PRISMA`**).
   - Si `DATABASE_NAME=MONGODB`, le script applique le profil **`mongodb`** et cible `mongodb` + `api`.
   - Si `DATABASE_NAME=POSTGRESQL_PRISMA`, le script applique le profil **`pg`** et enchaîne **`postgres`**, **`pgweb`** et **`api`** selon la commande (`api-restart` ne relance que **`postgres`** + **`api`** — voir `start.sh`).
   - Sinon (`IN-MEMORY`, …), seules les opérations sur **`api`** sont concernées (pas de conteneur de base du compose).
   - Après `./docker/start.sh` (`up`), le script suit directement les logs API en live dans le terminal (`logs -f api`).
     - Quitter l’affichage live : `Ctrl+C` (les conteneurs continuent de tourner).
     - Désactiver ce comportement : `API_FOLLOW_LOGS=0 ./docker/start.sh`.

   **Mode watch (dev inside container, sans rebuild à chaque changement) :**
   - `./docker/start.sh watch-up` (alias `dev-up`) : démarre `api-watch` avec bind mount du code (dépôt -> `/usr/src/app`) et watcher Nest/Nx dans le conteneur.
   - Les `node_modules` du conteneur sont dans un **volume Docker** (séparés de l’hôte) : au **démarrage**, un `pnpm install` est lancé pour se caler sur le `package.json` / `pnpm-lock.yaml` montés depuis l’hôte. Le dépôt inclut **`.npmrc`** (`confirm-modules-purge=false`) pour éviter le prompt interactif de pnpm sans TTY (sinon l’install peut s’arrêter avant d’avoir écrit les paquets). Après un changement de dépendance sur l’hôte, **commite le lockfile**, puis **redémarre** le watch — inutile de supprimer le volume à chaque fois.
   - Si le volume de deps semble corrompu : `watch-stop` puis `docker volume rm web-api-dev_web_api_node_modules` (ou le nom listé par `docker volume ls | grep web-api`), puis `watch-up`.
   - Les modifications de code sur l’hôte sont prises en compte automatiquement dans le conteneur (hot reload).
   - `./docker/start.sh watch-stop` (alias `dev-stop`) : stoppe le mode watch (et Mongo ou Postgres + pgweb si le profil correspondant est actif dans le script, comme pour `watch-up`).
   - Le service `api-watch` tourne d’abord en **root** le temps du `pnpm install` (le volume `node_modules` appartient à root par défaut) puis **Nx** en utilisateur **`node`**. TTY : `docker exec -it web-api-watch sh` (root) ou `docker exec -it -u node web-api-watch sh` pour un shell en `node`.
   - En mode watch, les logs `api-watch` sont suivis en live à la fin de la commande.

   **Import utilisateurs de démo (Mongo) :**
   - `./docker/start.sh dump-users` : importe `docker/dump/user.json` dans `bugbountyapp.users` avec `--jsonArray --drop` (écrase la collection avant import). Compte de démo : voir **[PostgreSQL et Prisma](#postgresql-et-prisma)** ci-dessus.
   - Pour créer un autre utilisateur de dump, génère `passwordHash` avec la même logique que l'API (scrypt, format `salt:hash`) :
   ```sh
   node -e 'const crypto=require("crypto"); const salt=crypto.randomBytes(16).toString("hex"); const hash=crypto.scryptSync("password123",salt,64).toString("hex"); console.log(salt+":"+hash);'
   ```
   - Copie la sortie dans le champ `passwordHash` de `docker/dump/user.json` (le hash change à chaque exécution car le sel est aléatoire).

   Le script lit **`server/.env`** et n’ajoute **`--profile mongodb`** ou **`--profile pg`** que lorsque `DATABASE_NAME` vaut **`MONGODB`** ou **`POSTGRESQL_PRISMA`** (y compris pour `down`, pour arrêter les bons services).

   **Sans** le script — **Mongo** :

   ```sh
   docker compose -f docker/compose.dev.yaml --profile mongodb up --build -d
   ```

   **Sans** le script — **Postgres** :

   ```sh
   docker compose -f docker/compose.dev.yaml --profile pg up --build -d
   ```

   **Sans** base Docker Compose (ex. en mémoire) :

   ```sh
   docker compose -f docker/compose.dev.yaml up --build -d
   ```

3. **URLs**

   | Service            | URL |
   | ------------------ | --- |
   | API (préfixe REST) | `http://localhost:3003/api` (port hôte par défaut **3003** ; surcharge avec **`API_HOST_PORT`** dans `server/.env`, utilisé par `compose.dev.yaml`) |
   | OpenAPI (Swagger UI) | `http://localhost:3003/api/docs` (même port hôte) |
   | mongo-express      | uniquement si `DATABASE_NAME=MONGODB` — `http://localhost:8086` |
   | pgweb              | si profil **pg** (`POSTGRESQL_PRISMA`) — `http://localhost:8087` (surcharge **`PGWEB_HOST_PORT`**) |
   | MongoDB (depuis l’hôte) | uniquement si `DATABASE_NAME=MONGODB` — `mongodb://localhost:27017` / base `bugbountyapp` |
   | PostgreSQL (depuis l’hôte) | si profil **pg** — `localhost:5432` (surcharge **`POSTGRES_HOST_PORT`**) |

   **mongo-express :** l’UI ne demande pas de mot de passe en dev (`ME_CONFIG_BASICAUTH=false` dans `compose.dev.yaml`). Sans cette option, l’image utilise souvent l’ancien couple **admin** / **pass** pour l’auth HTTP de l’interface — à éviter hors machine locale.

En mode profil **Mongo**, vérifie que les ports **27017**, **3003** (ou **`API_HOST_PORT`**) et **8086** sont libres. En mode profil **Postgres**, vérifie **5432** (ou **`POSTGRES_HOST_PORT`**), **8087** (ou **`PGWEB_HOST_PORT`**) et le port API.

**Journaux (mode Mongo) :** `cd docker && docker compose -f compose.dev.yaml --profile mongodb logs -f`

**Journaux (mode Postgres) :** `cd docker && docker compose -f compose.dev.yaml --profile pg logs -f`

**Journaux (API seule) :** `cd docker && docker compose -f compose.dev.yaml logs -f`

### 2. Installation manuelle (Node sur l’hôte)

Sans conteneur **API**. Installe une base joignable depuis ta machine (**Postgres** et/ou **Mongo** selon `DATABASE_NAME`).

1. **Dépendances** (racine du dépôt) :

   ```sh
   pnpm install
   ```

2. **`server/.env`** (voir **[Installation](#installation)**).

   **PostgreSQL + Prisma** : `DATABASE_NAME=POSTGRESQL_PRISMA`, **`DATABASE_URL`** avec hôte **`localhost`** (ou `127.0.0.1`) vers ton Postgres. Puis applique le schéma : voir **[PostgreSQL et Prisma](#postgresql-et-prisma)** (`prisma generate`, `migrate deploy`, seed optionnel).

   **MongoDB** : `DATABASE_URL=mongodb://localhost:27017/bugbountyapp` (les lignes `mongodb://mongodb…` du `.env.example` sont pour l’API **dans** Docker uniquement).

   Dans tous les cas : `JWT_SECRET`, `PORT`, `CORS_ORIGIN`, etc.

3. **API en dev** :

   ```sh
   npx nx serve web-api
   ```

   Port : **`PORT`** dans `.env` (défaut **3000** ; aligne les e2e si tu compares avec l’API Docker sur **3003**).

---

## Autres commandes

```sh
npx nx build web-api
```

```sh
npx nx show project web-api
```

[Exécuter des tâches avec Nx](https://nx.dev/features/run-tasks)

### Tests e2e (HTTP)

Les specs sous `e2e/` envoient les requêtes vers l’URL dérivée de **`HOST`** et **`PORT`** (voir `e2e/src/constants.ts` et `e2e/src/support/test-setup.ts`), par défaut **`http://localhost:3000`**.

- L’**API en cours d’exécution** (souvent Docker : mappage hôte **`3003`**, via `API_HOST_PORT` dans le script `docker/`) : ne lance **pas** un second `npx nx serve` sur le **même** port. Pour cibler le conteneur, exporte le port hôte : par exemple `PORT=3003` (et `AUTH_TYPE=PASSPORT_JWT` si besoin) puis `pnpm exec nx run e2e:e2e` — sans autre processus sur ce port.
- Pour un **`nx serve` local** en parallèle de Docker sur 3003, utilise un **autre** port libre (p.ex. `3000` ou `3010` dans ton `.env`) et la **même** valeur de `PORT` quand tu lances l’e2e.

---

## Documentation API

- **Swagger (OpenAPI)** : interface interactive sur `/api/docs` (voir le tableau *URLs* ci-dessus selon ton port).
- **Notes HTTP** : [docs/api.md](./docs/api.md).

---

## Liens utiles

- [Documentation Nx — Node](https://nx.dev/nx-api/node)
- [Nx et CI](https://nx.dev/ci/intro/ci-with-nx)

---

## Test auth Bruno/Postman (PASSPORT_JWT + IN-MEMORY)

Section dédiée pour vérifier rapidement le flow auth sans dépendance DB.

### 1) Configuration `.env`

Dans `server/.env` :

- `AUTH_TYPE=PASSPORT_JWT`
- `DATABASE_NAME=IN-MEMORY`
- `JWT_SECRET=mon-lapin-caillousky-dans-la-serre`

### 2) Lancer l'API

Depuis `server/` :

```sh
pnpm run start
```

Base URL par défaut :

- `http://localhost:3000`

### 3) Register (Bruno/Postman)

- Méthode : `POST`
- URL : `http://localhost:3000/api/auth/register`
- Headers :
  - `Content-Type: application/json`
- Body :

```json
{
  "username": "john-test-20260508",
  "email": "john.test.20260508@example.com",
  "password": "StrongPassword123!"
}
```

Réponse attendue (exemple) :

```json
{
  "token": "<jwt>",
  "user": {
    "email": "john.test.20260508@example.com",
    "uid": "abd4481a-6064-4d17-b57d-71e3e1ecccf1",
    "username": "john-test-20260508"
  },
  "require2FA": false
}
```

### 4) Login (Bruno/Postman)

- Méthode : `POST`
- URL : `http://localhost:3000/api/auth/login`
- Headers :
  - `Content-Type: application/json`
- Body :

```json
{
  "email": "john.test.20260508@example.com",
  "password": "StrongPassword123!"
}
```

### 5) Vérifier le JWT dans jwt.io

- Colle le token retourné par `login` dans [jwt.io](https://jwt.io/).
- Utilise ce secret :

```text
mon-lapin-caillousky-dans-la-serre
```

- Vérifie que la signature est valide et que le payload contient notamment :
  - `user_id`
  - `email`
  - `sub`
  - `iat`, `exp`

Exemple visuel de configuration jwt.io :

![JWT example for local testing](docs/jwt_example.png)

### 6) Test d'une route protégée (optionnel)

- Méthode : `GET`
- URL : `http://localhost:3000/api/users/me`
- Header :
  - `Authorization: Bearer <token>`

Si tout est correct, la route répond sans `401`.
