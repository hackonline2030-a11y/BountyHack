# Web API 

API NestJS (auth, users, ping) — workspace [Nx](https://nx.dev).

*English version : [Go to english version](./README.en.md)*

1. [Documentation sur ce repo & liens utiles](#documentation)
   
2. [Démarrage api](#démarrage-api)

3. [Installation](#installation)
- [Variables d'environnements et authentification](#variables-denvironnements-et-authentification)
- [Configurer la base de donnée : avec ou sans docker](#installation-de-la-base-de-donnée-avec-ou-sans-docker)
- [Configurer Redis](#configurer-redis)

4. Post-installation
- [Seeder](#seeder-user-and-report-draft)
- [Bruno/Postman](#test-auth-brunopostman-passport_jwt--in-memory)
- [Commandes utiles](#commandes-utiles)
  
5. [Installation via Nx : remarques](#installation-avec-nx)
6. [TroubleShooting](#troubleshooting-dépannage)
7. [Configurer son LLM](#configurer-son-llm)

## Documentation 

### Sur ce repository :

- **Swagger (OpenAPI)** : interface interactive sur `/api/docs` (voir le tableau *URLs* ci-dessus selon ton port). Les routes **`auth/password-reset/*`** y figurent avec corps de requête, schémas de réponse et codes d’erreur lorsque **`DATABASE_NAME=POSTGRESQL_PRISMA`**.
- **Notes HTTP** : [docs/api.md](./docs/api.md).
- **Décisions d’architecture (ADR)** : [../docs/adr/architecture_server_adr.md](../docs/adr/architecture_server_adr.md) — inclut une section **Réinitialisation de mot de passe** (couches, périmètre Prisma, sécurité, Swagger).

---

### Liens utiles

- [Documentation Nx — Node](https://nx.dev/nx-api/node)
- [Nx et CI](https://nx.dev/ci/intro/ci-with-nx)  


## Démarrage API 

**Vous devez procéder à la partie installation avant si ce n'est pas déjà fait**

### Démarrer l'API

#### Démarrer en mode développement

```bash
pnpm start

# Ou directement avec Node.js
node dist/main.js  # après build
```

#### Vérifier que le build compile (pour la production) 

```bash
pnpm run build
```

#### Tests

Chaque usecase a ses tests unitaires
Les tests d'intégrations et e2e sont présent mais pas à 100%.

```bash
pnpm run test
```

**Tests e2e (HTTP)**

Les specs sous `e2e/` envoient les requêtes vers l’URL dérivée de **`HOST`** et **`PORT`** (voir `e2e/src/constants.ts` et `e2e/src/support/test-setup.ts`), par défaut **`http://localhost:3000`**.

```bash
pnpm exec nx run e2e:e2e
```

#### Vérification

L'API devrait être accessible sur : http://localhost:3000/api

## Installation

### Variables d'environnements et authentification

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

#### Éditer le fichier `.env`, voici les essentiels :
```env
# Configuration MySQL
DATABASE_NAME=MYSQL_PRISMA
DATABASE_URL="mysql://root:[votre-mot-de-passe]@localhost:3306/bugbountyapp?allowPublicKeyRetrieval=true"

# Configuration API
NODE_ENV=development
JWT_SECRET=dev-secret-key-change-in-production
CORS_ORIGIN=http://localhost:3001
```
JWT_SECRET doit être identique dans le .env de /server et celui de /client

**Générer un JWT_SECRET sécurisé :**

```bash
# Option 1 : en ligne
Aller sur (ce lien)[https://generate-secret.vercel.app/64]

# Option 2 : avec Node.js
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"

# Option 2 : avec OpenSSL (Linux/macOS)
openssl rand -hex 64
```

### Authentification et base de données

Les variables **`AUTH_TYPE`** et **`DATABASE_NAME`** se combinent. 

Points important :
- L'architecture auth est extensible via `AUTH_TYPE`, mais l'implémentation active est **`PASSPORT_JWT`**.
- Les options de base de donnees restent multiples via `DATABASE_NAME` (`MONGODB`, `MYSQL_PRISMA`, `POSTGRESQL_PRISMA`, `IN-MEMORY`).
- Avec par exemple **`DATABASE_NAME=MONGODB`**, les utilisateurs (email, hash de mot de passe, profil) sont stockés dans la base Mongo définie par **`DATABASE_URL`**.
- **2FA (schema et prochaines fonctionnalites)** : le projet ne fait evoluer cette couche que sous **`DATABASE_NAME=POSTGRESQL_PRISMA`** (migrations Prisma sur la base PostgreSQL). Pas d'extension parallele sur Mongo ou in-memory pour la 2FA pour l'instant ; voir **`src/auth/README.md`**.

**MAJ** - On utilisera MYSQL_PRISMA et IN-MEMORY (pour les tests)

Voir aussi les commentaires dans **`.env.example`**.

#### Configuration `AUTH_TYPE` et fichier `auth-env.ts`

La configuration d'authentification est centralisee dans **`src/auth/config/auth-env.ts`**.

- Ce fichier lit et normalise les variables d'environnement (`AUTH_TYPE`, `DATABASE_NAME`).
- Il centralise les choix de configuration auth/database pour eviter des checks disperses dans les modules Nest.

Valeur prise en charge pour **`AUTH_TYPE`** :

- `PASSPORT_JWT` : flux JWT via Passport/Nest (`passport-jwt`).

Recommandation : toute nouvelle condition liee a la configuration d'authentification doit passer par **`auth-env.ts`** plutot que des checks directs sur `process.env.AUTH_TYPE`.


## Installation de la base de donnée (avec ou sans docker)

1. Soit Manuelle (XAMPP, Mysql + Aminer ou MySQL + Phpmyadmin sur un serveur Nginx ou Apache)
2. Soit avec Docker (avec ou sans le script)

### Manuelle (MySQL sur sa machine)

#### Créer la base de données
```bash
# Avec MySQL CLI
mysql -u root -p -e "CREATE DATABASE bugbountyapp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Ou avec XAMPP via phpMyAdmin : http://localhost/phpmyadmin/
# Créer une nouvelle base "bugbountyapp" avec interclassement "utf8mb4_unicode_ci"
```

#### Exécute cette commande depuis le terminal pour créer un utilisateur bugbountyapp avec les bon droits :

```bash
sudo mysql -u root -e "CREATE USER 'bugbountyapp'@'127.0.0.1' IDENTIFIED BY 'bugbountyapp'; GRANT ALL PRIVILEGES ON bugbountyapp.* TO 'bugbountyapp'@'127.0.0.1'; FLUSH PRIVILEGES;"
```

#### Vérifier la connexion

```bash
mysql -u bugbountyapp -p bugbountyapp bugbountyapp
```

#### Monter la base de donnée : 
- VIA UN DUMP
- VIA PRISMA

##### VIA UN DUMP : Importer le dump avec les données de test

**Important** : Ces commandes se connectent au serveur MySQL sur `localhost:3306`. Assurez-vous que :
- XAMPP ou votre propre architecture est démarré 
- Aucune autre instance MySQL n'est en conflit sur le port 3306 (si c'est le cas : voir à la fin dans commandes utiles)

```bash
# Vérifier quel serveur MySQL répond (doit montrer les bases XAMPP si vous utilisez XAMPP)
mysql -u root -p -e "SHOW DATABASES;"

# Import du dump complet (structure + données)
mysql -u root -p bugbountyapp < dump/dump.mysql.native.sql

# Vérifier l'import
mysql -u root -p bugbountyapp -e "SHOW TABLES; SELECT COUNT(*) as users_count FROM users;"
```

**Pour XAMPP spécifiquement** :
- Mot de passe root par défaut : souvent vide (`""`)
- Interface phpMyAdmin disponible : http://localhost/phpmyadmin/
- Vérification XAMPP actif : les bases `information_schema`, `mysql`, `performance_schema`, `phpmyadmin` doivent être visibles

#####  VIA PRISMA

#### Monter les tables de la base de donnée

```sh
pnpm exec prisma db push
```

#### Générer le client Prisma
```bash
pnpm exec prisma generate
```

---

## Installer la DB MySQL avec docker

Toutes les commandes **`docker compose`** ci-dessous s’exécutent depuis **`bugbountyapp/server/`** (chemins relatifs au fichier compose et au SQL).

Pour itérer vite sur l'API, tu peux faire tourner :

- l'API NestJS en local sur ta machine (hot reload plus rapide, debug IDE plus simple),
- la base MySQL dans Docker,
- Redis dans Docker (rate limiting, jobs PDF),
- Adminer et Redis Insight dans Docker pour visualiser MySQL et Redis.

Nous pourrions brancher Postgre ou Mongo DB assez aisément plus tard : c'est pourquoi des commandes sont aussi prévu.<br> 
Mais nous supprimerons ces commandes si MySQL se maintient comme choix en prod finale.

Depuis `server/` :

1. Démarrer MySQL + Redis (profils **`mysql`** et **`redis`**) :

Via pnpm (si tu a donné les droits root à docker) :

```sh
pnpm run docker:mysql
```

Sans pnpm (notamment si tu préfères ne pas donner à docker les droits root) :

Les profils **`mysql`** et **`redis`** ne sont pas le défaut du compose — il faut les préciser explicitement.

```sh
docker compose -f docker/compose.dev.yaml --profile mysql --profile redis up -d mysql adminer redis redisinsight
```

Interfaces :

- **Adminer** (MySQL) : http://localhost:8088 — serveur **`mysql`**, utilisateur / mot de passe **`bugbountyapp`**
- **Redis Insight** (Redis) : http://localhost:5540 — dans « Add database » : host **`redis`**, port **`6379`** (nom DNS Compose, pas `localhost`)

3. Configurer `server/.env` pour exécuter l'API **hors Docker** :

   - `DATABASE_NAME=MYSQL_PRISMA`
   - `DATABASE_URL=mysql://bugbountyapp:bugbountyapp@localhost:3306/bugbountyapp?allowPublicKeyRetrieval=true`
   - `REDIS_HOST=127.0.0.1`, `REDIS_PORT=6379`, `REDIS_URL=redis://127.0.0.1:6379`

   Important : utilise `localhost` / `127.0.0.1` pour communiquer avec Docker depuis l’hôte (API hors conteneur).

4. Appliquer Prisma (mysql) depuis l'hôte (ajouter mysql à la fin) :

   ```sh
   pnpm run prisma:generate:mysql
   pnpm run prisma:migrate:deploy:mysql
   ```

5. Aprés avoir lancé sur votre machine l'api (voir section démarrage), ouvrir les interfaces :

   - Adminer (MySQL) : `http://localhost:8088`
   - Redis Insight : `http://localhost:5540`

Arrêt :

```sh
pnpm run docker:mysql:stop
```

```sh
sudo docker compose -f docker/compose.dev.yaml --profile mysql --profile redis stop adminer mysql redis redisinsight
```

Ou teardown complet :

```sh
pnpm run docker:mysql:down
```

```sh
sudo docker compose -f docker/compose.dev.yaml --profile mysql --profile redis down
```

## Configurer Redis

Redis est utilisé par l’API (rate limiting, jobs PDF asynchrones, etc.). Variables dans **`server/.env`** : `REDIS_HOST`, `REDIS_PORT`, `REDIS_URL` (voir **`.env.example`**).

### Redis avec Docker

Avec la section [Installer la DB MySQL avec docker](#installer-la-db-mysql-avec-docker), Redis et Redis Insight sont démarrés en même temps que MySQL (`--profile mysql --profile redis`).

Redis seul (sans MySQL) :

```sh
docker compose -f docker/compose.dev.yaml --profile redis up -d redis redisinsight
```

L’API hors conteneur utilise `REDIS_HOST=127.0.0.1` et `REDIS_PORT=6379` (port exposé sur l’hôte).

### Redis en local

Sans Docker, installe Redis directement sur ta machine :

- **Installation Linux** : [Install Redis — redis.io](https://redis.io/docs/latest/operate/oss_and_stack/install/archive/install-redis/)
- **Client GUI (lecture / édition des clés)** : [5 Best Free Redis GUI Clients in 2025 — DbGate](https://www.dbgate.io/news/2025-08-11-free-redis-clients/)

Après installation, vérifie que le serveur répond :

```bash
redis-cli ping
# PONG
```

Puis aligne **`server/.env`** sur ton instance locale (`REDIS_URL=redis://127.0.0.1:6379` par défaut).

## Seeder (user et report-draft)

Nous avons des seeds prévu pour les user et les report-draft
Cependant si installation via dump, les users sont déjà présent.

Attention : bien vérifier `DATABASE_NAME=MYSQL_PRISMA` dans **`server/.env`**. 
Détails Prisma : [`prisma/README.md`](prisma/README.md).

### Utilisateurs de test disponibles (vérifier s'ils sont déjà là dans la table `users`)

Le dump contient plusieurs utilisateurs de test (avec `password` ou `password123` ou `password1234` comme MDP) :

| Email | Username | Rôle | Description |
|-------|----------|------|-------------|
| `demo-user@example.local` | `demo-user` | **SUPER_ADMIN** | Administrateur principal |
| `coord@example.com` | `Corda` | **COORDINATOR** | Coordinateur d'équipe |
| `mentor@example.com` | `mentor` | **MENTOR** | Mentor/Formateur |
| `qc@example.com` | `Qualité` | **QUALITY_CHECKER** | Contrôleur qualité |

**Connexion de test** :
- Email : `demo-user@example.local`
- Mot de passe : `password123` ou `password` (à vérifier l'un ou l'autre)

Comptes créés par le seed dev-draft : 
- `dev-hunter-1@example.local`,
- `dev-qc-1@example.local`,
- `dev-sa-1@example.local`, etc.
Mot de passe identique à **`demo-user`** (`password123`).

A partir du compte surper-admin vous pouvez créer vos propre user dans chaque catégorie.

### Seed des users SANS DOCKER (Avec Prisma) : 

**Prisma depuis la machine hôte** 
- MySQL exposé sur `localhost:3306`), sans passer par le conteneur `mysql` pour le SQL

```sh
DATABASE_NAME=MYSQL_PRISMA DATABASE_URL=mysql://bugbountyapp:bugbountyapp@127.0.0.1:3306/bugbountyapp \
  pnpm exec prisma db seed
```

### Seed des user via docker :
- `pnpm docker:prisma:seed:mysql`

Commande manuelle : voir le `package.json` au niveau de la commande ci-dessus.

### Seed des rapports VIA DOCKER et prisma + mysql

**Seed SQL cycle report-draft** (non destructif, ré-exécutable) — équivalent de `pnpm docker:prisma:seed:dev-draft` :

Ajoutez `sudo` avant si vous n'avez pas donné à docker des droits root : 

```sh
docker compose -f docker/compose.dev.yaml --profile mysql exec -T mysql \
  mysql -ubugbountyapp -pbugbountyapp bugbountyapp \
  < prisma/seed/dev-report-draft-bucket-vault.mysql.sql
```

Raccourcis pnpm (réécrivent `DATABASE_URL` depuis `.env`) :
- `pnpm docker:prisma:seed:dev-draft`.


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

## Commandes utiles

### Si installation manuelle

```bash
# Reset complet de la base (avec migrations Prisma)
pnpm exec prisma migrate reset
pnpm exec prisma db seed

# Interface graphique pour la base
pnpm exec prisma studio  # http://localhost:5555

# Re-import du dump si nécessaire
mysql -u root -p bugbountyapp < dump/dump.mysql.native.sql

# Créer un super admin en production
pnpm run create-super-admin

# Tests
pnpm run test
```

## TroubleShooting (Dépannage)

### Port déjà utilisé
```bash
# Changer le port dans .env
PORT=3001

# Ou tuer le processus
lsof -ti:3000 | xargs kill -9
```

### Si installation manuelle - Erreur de connexion MySQL
- Vérifier que MySQL fonctionne : `mysql -u root -p -e "SELECT 1;"`
- Ajuster `DATABASE_URL` dans `.env`
- Pour XAMPP, utiliser : `mysql://root:@localhost:3306/bugbountyapp`

### Si installation manuelle - Erreur Prisma
```bash
# Régénérer le client
DATABASE_NAME=MYSQL_PRISMA pnpm exec prisma generate

# Vérifier la connexion
pnpm exec prisma db pull
```

## Installation avec Nx 

## Prérequis

- **Node.js** 24+ et **pnpm** (voir `server/package.json` → `engines`)
- **Docker** et Docker Compose (**optionnel**, uniquement pour le **dev local** décrit ci-dessous — pas la cible prod)

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

## Configurer son LLM

Pour que les consignes projet soient bien prises en compte par un agent (LLM), ajoute une règle explicite dans ton outil et référence ces fichiers :
- [`Agents.md`](./Agents.md)
- [`Claude.md`](./Claude.md)

Tu peux aussi ajouter tes skills dans **`.agent/`** — voir la section [Configurer son LLM](../README.md#configurer-son-llm) du README racine (hiérarchie, Cursor vs Claude, lecture non automatique).

Pour l’API, privilégie :
- **`server/.agent/`** — Nx, Prisma MySQL, Docker/Redis, conventions server
- **`server/src/<module>/.agent/`** (optionnel) — skill métier d’un module précis

**Cursor** : copier/symlink vers `.cursor/skills/` pour activer un skill partagé. **Claude** : reprendre le `SKILL.md` depuis `.agent/`.

Rappel : 1 skill = 1 intention ; pas de duplication des règles déjà dans [`../Agents.md`](../Agents.md) ou [`Agents.md`](./Agents.md).
