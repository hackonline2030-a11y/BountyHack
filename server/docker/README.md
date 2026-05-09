# Docker — API Bug Bounty (backend)

Ce dossier regroupe **`Dockerfile`**, **`compose.dev.yaml`** (développement) et **`compose.prod.yml`** (déploiement type VPS). Les commandes sont à lancer depuis la machine hôte ; tous les exemples **`docker compose`** supposent que vous êtes dans **`server/docker/`** (racine du projet compose dev : même répertoire que `start.sh`).

**`start.sh`** lit **`DATABASE_NAME`** dans **`server/.env`** et active :
- le profil **`pg`** si **`POSTGRESQL_PRISMA`** (Postgres + pgweb) ;
- le profil **`mongodb`** si **`MONGODB`** (Mongo + mongo-express) ;
- sinon pas de conteneur de base Docker pour ce mode.

Documentation générale du backend : [`../README.md`](../README.md).

---

## Prérequis — installer Docker (si besoin)

### Linux (ex. Ubuntu / Debian)

1. **Docker Engine + plugin Compose v2** (recommandé) : suivre la doc officielle  
   https://docs.docker.com/engine/install/  
   (paquet `docker-ce`, service `docker`, groupe `docker`).

2. Vérifier l’installation :

   ```bash
   docker --version
   docker compose version
   ```

   Si `docker compose` échoue mais `docker-compose` (V1 standalone) existe, le script **`start.sh`** bascule dessus automatiquement.

3. **Droits utilisateur** : éviter `sudo` sur chaque commande :

   ```bash
   sudo usermod -aG docker "$USER"
   # puis fermer/réouvrir la session (ou logout/login).
   ```

4. **Compose** doit pouvoir construire une image : aucun lien obligatoire avec le frontend du monorepo pour l’API (contexte de build : dossier **`server/`**).

### macOS

- **Docker Desktop** : https://docs.docker.com/desktop/setup/install/mac-install/  
  Inclut Docker Engine et **`docker compose`**. Les chemins et commandes du reste de ce README sont identiques à Linux (terminal bash/zsh).

### Windows — en quoi c’est différent ?

| Sujet | Linux / macOS | Windows « natif » (PowerShell, cmd) |
|--------|----------------|--------------------------------------|
| **Script `start.sh`** | Bash, exécutable `#!/usr/bin/env bash` | Pas de bash par défaut — il faut Git Bash, ou **WSL**, ou adapter les commandes en **`docker compose` manuel** (voir section sans `start.sh`). |
| **Chemins du dépôt** | Style POSIX (`/home/.../server/docker`) | Sous PowerShell : **`C:\...\server\docker`**. Dans **WSL** : plutôt **`/home/<user>/...`** (voir ci‑dessous). |
| **Docker** | Engine + CLI souvent directs | Approche habituelle : **Docker Desktop** pour Windows ; le moteur tourne dans une VM / intégration **WSL2**. |
| **Fins de ligne** | LF | Risque **CRLF** sur les scripts si mal configuré : préférez LF pour `*.sh` (`git config core.autocrlf` selon équipe ; sous WSL/clonage Linux, problème rare). |

**Recommandation pour ce projet (scripts bash + `./start.sh`)** : développer sous **WSL2** (Ubuntu…) avec le dépôt sur le système de fichiers **Linux WSL**, et Docker Desktop configuré pour cette distro. Vous retrouvez le même flux que sur Linux.

### Windows — installer ou vérifier WSL et y travailler

#### 1) Vérifier si WSL est déjà présent

Dans **PowerShell** ou **Invite de commandes** (fenêtre ouverte **en tant qu’utilisateur**, pas forcément besoin admin pour `-l`) :

```powershell
wsl --version
wsl --list --verbose
```

- Si **`wsl`** répond avec une **version** et une **liste** de distributions : WSL est installé. La colonne **VERSION** doit idéalement afficher **`2`** (WSL2). Si vous voyez **`1`**, migrer :  
  `wsl --set-version <NomDeLaDistro> 2`  
  (nécessite parfois une mise à jour du noyau WSL : suivre les messages de Windows.)

#### 2) Installer WSL (si absent ou désactivé)

Toujours en **PowerShell** **en tant qu’administrateur** (clic droit → Exécuter en tant qu’administrateur) :

```powershell
wsl --install
```

- Redémarrage souvent demandé par Windows. Après reboot, Ubuntu peut s’ouvrir pour créer votre **utilisateur Linux** et le mot de passe.

Si votre Windows est plus ancien ou si `--install` n’est pas reconnu : suivre la doc Microsoft **« Install WSL »** (couche mise à jour, option composants facultatifs, etc.) :  
https://learn.microsoft.com/fr-fr/windows/wsl/install

#### 3) Installer une distribution Ubuntu (facultatif si `wsl --install` ne propose rien)

- Microsoft Store : recherche « Ubuntu » (22.04 LTS ou 24.04 LTS), puis **Ouvrir** pour finaliser la création du compte.

Ou en administrateur :

```powershell
wsl --install -d Ubuntu-24.04
```

#### 4) Entrer dans WSL (ouvrir un terminal Linux)

- **Windows 11** : Terminal Windows → onglet **Ubuntu** (ou la distro installée).  
- Ou PowerShell / cmd : `wsl` ou `wsl -d Ubuntu` pour cibler une distro.

Vous êtes alors dans un shell **bash** avec chemins du type **`/home/<vous>/...`**.

#### 5) Où cloner le dépôt pour Docker + ce README

- **Recommandé** : cloner / copier le projet **dans le disque Linux WSL** (ex. `~/dev/bugbountyapp`), **pas** uniquement sous `/mnt/c/...`  
  - Raisons : meilleures perfs I/O, moins de soucis avec **bind mounts** Docker (mode watch, volumes) et permissions de fichiers.

#### 6) Docker avec WSL2

1. Installez **Docker Desktop for Windows** : https://docs.docker.com/desktop/setup/install/windows-install/
2. Ouvrez **Docker Desktop** → **Settings** → **Resources** → **WSL integration** → activez l’intégration pour votre distribution (**Ubuntu**, etc.).
3. Dans **WSL** :

   ```bash
   docker version
   docker compose version
   ```

   Les deux doivent répondre depuis le même terminal où vous exécuterez **`./start.sh`**.

#### 7) Ensuite : même flux que Linux

Placez‑vous sous **`server/docker/`** dans WSL et suivez le reste de ce fichier (`./start.sh` ou commandes **`docker compose` équivalentes`).

### Windows sans WSL (PowerShell uniquement)

Possible si vous utilisez uniquement **`docker compose -f compose.dev.yaml ...`** en recopiant les commandes de ce README, mais **`start.sh`** n’est pas utilisé tel quel : il faudrait **Git Bash**, ou **[WSL](https://learn.microsoft.com/fr-fr/windows/wsl/install)**, ou exécuter `bash docker/start.sh` depuis Git Bash.

---

## Fichiers d’environnement

| Fichier | Rôle |
|--------|------|
| **`server/.env`** | Variables de l’API (lu par `compose.dev.yaml` via `env_file: ../.env`). À créer depuis [`../.env.example`](../.env.example). |
| **`server/docker/.env`** (prod) | Pour **`compose.prod.yml`** : fichier attendu à côté du compose sur le VPS (voir en-tête de `compose.prod.yml`). |

**Point critique avec Mongo en Docker (dev)** : depuis le conteneur `api`, l’hôte Mongo s’appelle le **nom du service Compose** (`mongodb`), pas `localhost`. Si `DATABASE_URL` pointe encore vers `mongodb://localhost:27017`, l’API **dans** Docker ne joindra pas Mongo — utiliser une URL du type `mongodb://mongodb:27017/…` comme indiqué dans `.env.example`.

---

## Profils Docker Compose (`compose.dev.yaml`)

| Profil | Contenu démarré |
|--------|-----------------|
| *(aucun)* | Service **`api`** uniquement (image build `target: production`). |
| **`mongodb`** | **`mongodb`** + **`mongo-express`** + permet d’aligner **`api`** sur une stack avec base locale. Activé automatiquement par **`start.sh`** si **`DATABASE_NAME=MONGODB`** dans `server/.env`. |
| **`pg`** | **`postgres`** (PostgreSQL 18, image officielle **Alpine**) + **`pgweb`**. Activé par **`start.sh`** si **`DATABASE_NAME=POSTGRESQL_PRISMA`**, ou à la main : **`--profile pg`**. Par défaut : Postgres sur l’hôte **`5432`**, pgweb sur **`8087`** (mongo-express : **`8086`**). |
| **`watch`** | **`api-watch`** (code monté depuis l’hôte, `pnpm install` + `nx serve` dans le conteneur, reload). Jamais utilisé seul comme « prod » ; destiné au dev Docker. |

Projet Compose : nom **`web-api-dev`**.

---

## PostgreSQL (Postgres + pgweb)

Le profil **`pg`** s’active lorsque **`DATABASE_NAME=POSTGRESQL_PRISMA`** dans **`server/.env`** (Postgres + pgweb + API selon la commande). **MongoDB** est une alternative (profil **`mongodb`**). Les services **Postgres** ci‑dessous servent notamment à :

- lancer une base **PostgreSQL** avec **`start.sh`** ou le compose ;
- monter **uniquement Postgres + pgweb** sans API (**voir ci‑dessous**).

Variables optionnelles (fichier d’environnement ou shell) : **`POSTGRES_USER`** (défaut `bugbountyapp`), **`POSTGRES_PASSWORD`** (défaut `bugbountyapp` en dev), **`POSTGRES_DB`** (défaut `bugbountyapp`), **`POSTGRES_HOST_PORT`** (défaut `5432`), **`PGWEB_HOST_PORT`** (défaut **`8087`** pour éviter le chevauchement avec mongo-express sur **`8086`**).

### Prisma, migrations et démo

Schéma et migrations : dossier **`server/prisma/`** (monté dans **`web-api-watch`** vers **`/usr/src/app`** — aucun volume Prisma supplémentaire). Commandes à lancer depuis **`server/`** :

| Script | Effet |
|--------|--------|
| **`pnpm docker:prisma:generate`** | `prisma generate` dans le conteneur **`web-api-watch`** (profils **`watch`** + **`pg`** actifs). |
| **`pnpm docker:prisma:deploy`** | `prisma migrate deploy` (applique l’historique des migrations, y compris seed SQL démo si présent dans une migration). |
| **`pnpm docker:prisma:migrate:dev`** | `prisma migrate dev` (interactif). |
| **`pnpm docker:prisma:seed-demo`** | `prisma db execute` sur le fichier SQL de la migration seed (ligne démo **`users`**). |

Prérequis : **`web-api-watch`** et **`postgres`** déjà démarrés (ex. **`pnpm docker:watch`** à la racine **`server/`**).

**Prisma sur la machine hôte** (base joignable en `localhost`) : `pnpm prisma generate`, `pnpm prisma migrate deploy`, `pnpm prisma:seed-demo`. Si **`DATABASE_URL`** dans **`server/.env`** cible encore le service Docker **`postgres`**, préférer **`pnpm prisma:migrate:deploy:docker`** et **`pnpm prisma:seed-demo:docker`** (scripts **`server/docker/*.cjs`** qui réécrivent l’URL vers **`127.0.0.1`** / **`POSTGRES_HOST_PORT`**).

Vue d’ensemble : [`../README.md`](../README.md#postgresql-et-prisma).

### Postgres seul (sans conteneur `api`) — `compose.dev.yaml`

Toujours depuis **`server/docker/`** : activez le profil **`pg`** et **ne listez que les services** **`postgres`** et **`pgweb`** — Compose ne démarre pas **`api`**.

```bash
docker compose -f compose.dev.yaml --profile pg up -d postgres pgweb

docker compose -f compose.dev.yaml --profile pg ps
docker compose -f compose.dev.yaml --profile pg logs -f postgres

docker compose -f compose.dev.yaml --profile pg down
docker compose -f compose.dev.yaml --profile pg down -v
```

- **pgweb** : `http://localhost:8087` par défaut (ou **`PGWEB_HOST_PORT`**).
- **Connexion depuis l’hôte** : `localhost:5432` (ou **`POSTGRES_HOST_PORT`**).

### Développement — Postgres en plus de la stack API (`compose.dev.yaml`)

Exemples (API + Mongo **ou** API seule + Postgres) :

```bash
# API + Mongo (profil mongodb) + Postgres + pgweb
docker compose -f compose.dev.yaml --profile mongodb --profile pg up -d --build

# API seule + Postgres + pgweb (sans Mongo)
docker compose -f compose.dev.yaml --profile pg up -d --build
```

Depuis un conteneur sur le même réseau Compose, l’hôte Postgres est le **nom de service** **`postgres`** :  
`postgres://bugbountyapp:bugbountyapp@postgres:5432/bugbountyapp` (adapter user / mot de passe / base si vous surchargez les variables).

Pour **tout arrêter** quand vous avez démarré Postgres, incluez le profil dans **`down`** :

```bash
docker compose -f compose.dev.yaml --profile watch --profile mongodb --profile pg down --remove-orphans
```

(ajustez **`mongodb`** / **`watch`** selon ce que vous aviez lancé.)

### Production — Postgres optionnel (`compose.prod.yml`)

Par défaut, la prod démarre **`app`** + **`mongo`** uniquement. Pour ajouter **PostgreSQL** sur le même réseau Docker (sans l’exposer sur l’hôte) :

```bash
docker compose -f compose.prod.yml --env-file .env --profile pg up -d
```

Définir au minimum **`POSTGRES_PASSWORD`** dans le `.env` à côté du compose (et les autres **`POSTGRES_*`** si besoin). Aujourd’hui, le service **`app`** pointe encore vers Mongo via **`DATABASE_URL`** dans le fichier d’exemple prod : brancher l’API sur Postgres suppose une évolution applicative et une **`DATABASE_URL`** adaptée.

### Faut-il extraire Mongo dans un `compose.mongo.yaml` séparé ?

**En général, non**, tant que la stack **dev** reste un tout cohérent : un seul **`compose.dev.yaml`** évite d’avoir à chaîner plusieurs `-f` à chaque commande et documente un seul fichier « référence ».

**Cela devient pertinent** si plusieurs dépôts ou scripts ne consomment **que** la base, ou si vous voulez des cycles de vie très différents (bases partagées, versions figées). Dans ce cas, préférez souvent la directive **`include:`** de Compose pour inclure un fragment commun, plutôt que de dupliquer des services.

---

## Utiliser **`start.sh`** (recommandé en dev local)

À exécuter depuis **`server/docker/`**. Le wrapper **`start`** appelle **`start.sh`**.

### Ce que fait le script automatiquement

- Lit **`DATABASE_NAME`** dans **`server/../.env`** (donc **`server/.env`**). Si aucun fichier : valeur par défaut **POSTGRESQL_PRISMA** (pour le script uniquement ; mieux vaut toujours avoir un `.env` explicite, comme **`.env.example`**).
- Ajoute **`--profile mongodb`** si **`DATABASE_NAME=MONGODB`**, ou **`--profile pg`** si **`DATABASE_NAME=POSTGRESQL_PRISMA`**.
- **`down`** active les profils **`watch`**, **`mongodb`** et **`pg`** pour que tout service (dont **`api-watch`**) soit bien arrêté et que le réseau compose ne reste pas bloqué.

### Variables optionnelles reconnues par le script

| Variable | Effet |
|----------|--------|
| **`API_HOST_PORT`** | Port sur l’**hôte** mappé vers le port **3000** du conteneur API (défaut **3003** ; lu depuis **`server/.env`** par `compose.dev.yaml`). |
| **`API_FOLLOW_LOGS`** | Après `./start.sh up` : suivre ou non les logs API en direct (`1`/`true` par défaut ; **`0`** pour désactiver). |

### Commands détaillées

| Commande | Rôle |
|----------|------|
| **`./start.sh`** ou **`./start.sh up`** | Build (si nécessaire) et démarre la stack : **`api`** seul, ou **`mongodb`** + **`mongo-express`** + **`api`** si `DATABASE_NAME=MONGODB`, ou **`postgres`** + **`pgweb`** + **`api`** si `DATABASE_NAME=POSTGRESQL_PRISMA`. Vérifie la base (ping) si un profil DB est actif, affiche un récap d’URLs, puis peut enchaîner un **`logs -f api`** selon **`API_FOLLOW_LOGS`**. |
| **`./start.sh stop`** | Stoppe tous les services de la stack **dev** (**`api`**, **`api-watch`**, **`mongodb`**, **`mongo-express`** si présents). Ne supprime **pas** réseaux ni volumes : redémarrage rapide ensuite. |
| **`./start.sh down`** | **`docker compose … down --remove-orphans`** avec profils **`watch`** (+ **`mongodb`** si applicable). Coupe tout proprement, supprime le réseau projet. |
| **`./start.sh down -v`** | Comme **`down`**, mais supprime aussi les **volumes nommés** (données Mongo **`mongo_data`**, volume **`web_api_node_modules`** du watch, etc.). |
| **`./start.sh api-restart`** | Redémarrage **`api`** (et **`mongodb`** si profil Mongo) **sans rebuild** d’image (`--no-build`). |
| **`./start.sh api-stop`** | Arrêt des conteneurs **`api`** (**+ `mongodb`** si mode Mongo dans le script). |
| **`./start.sh logs`** | **`compose logs -f api`** uniquement (**Ctrl+C** stoppe la suite des logs sans arrêter les conteneurs). |
| **`./start.sh watch-up`** ou **`./start.sh dev-up`** | Démarre le mode **hot reload** (service **`api-watch`**) : même port que l’API classique, donc **`api`** est d’abord arrêté. Détails et implications dans la section **« Hot reload : `watch-up` / `api-watch` »** ci‑dessous. |
| **`./start.sh watch-stop`** ou **`./start.sh dev-stop`** | Arrête **`api-watch`** (+ Mongo + mongo-express si mode Mongo actif dans le script). |
| **`./start.sh dump-users`** | Échoue si pas **`DATABASE_NAME=MONGODB`**. Lance **`mongodb`** si besoin puis **`mongoimport`** dans la base **`bugbountyapp`**, collection **`users`**, fichier **`docker/dump/user.json`**, **`--drop --jsonArray`**. |

**URLs typiques** (avec ports par défaut) :

- API : `http://localhost:3003/api` (ou le port défini par **`API_HOST_PORT`**).
- Mongo Express : `http://localhost:8086` (uniquement si profil **`mongodb`** actif).

### Contraste : `./start.sh up` **sans** hot reload vs **`watch-up`** **avec**

| | **`./start.sh up`** (service **`api`**) | **`./start.sh watch-up`** (service **`api-watch`**) |
|---|----------------------------------------|-----------------------------------------------------|
| **Image Compose** | cible Dockerfile **`production`** — le code applicatif est celui **copié lors du build**. | cible Dockerfile **`development`** + **volume** du dépôt. |
| **Modifs des fichiers `.ts`** sur ta machine | Invisibles dans le conteneur tant que tu **ne rebuilds pas** l’image (`up --build` ou changement Dockerfile). | Fichiers sous **`server/`** montés dans le conteneur : **`nx serve`** (Nest) peut **recompiler / recharger** à chaude. |
| **Cas d’usage** | Tester une image proche prod, CI, perf « build figé ». | Boucle dev rapide depuis l’éditeur sur l’hôte. |

Sans **`watch-up`**, le script **`start.sh`** ne fait **pas** de hot reloading du sources ; c’est normal.

---

### Hot reload : `watch-up` / `api-watch`

Ce que fait Compose pour le service **`api-watch`** (voir `compose.dev.yaml`) :

1. **Bind mount** du dossier parent du compose vers **`/usr/src/app`** : tout le dossier **`server/`** de ton dépôt (hôte) est visible dans le conteneur. Tu édites sur l’hôte ; **`nx serve web-api`** tourne dans le conteneur et surveille ces fichiers.
2. **`node_modules` dans un volume nommé Docker** (**`web_api_node_modules`**) : ils ne sont **pas** ceux du disque Windows/Linux hôte mélangés tels quels (évite incompatibilités binaires, chemins trop longs, etc.). Au **démarrage**, le script de commande lance **`pnpm install`**, puis **`chown`** vers l’utilisateur **`node`** avant de lancer Nx.
   - Changement dans **`package.json`** / **`pnpm-lock.yaml`** sur l’hôte : **redémarre** **`watch-up`** après avoir poussé un lockfile cohérent ; sinon le volume peut être désynchronisé.
3. **Surveillance fichiers sous Docker** : variables comme **`CHOKIDAR_USEPOLLING`** aident Nest/Webpack/Nx à voir les changements à travers les couches fichiers (surtout Windows ou certains setups). **`NX_DAEMON=false`** évite les soucis de socket daemon Nx dans le conteneur.

**Ce que ça implique pour toi**

- Travaille de préférence avec le projet sur le système de fichiers **Linux** (WSL2 ou machine Linux) ; évite uniquement **`/mnt/c/...`** pour le dépôt si tu constates reload lent ou flaky.
- Un hot reload peut échouer ou nécessiter un redémarrage du conteneur pour certains changements (nouveau module natif, **gros** refactoring de **`webpack.config`**, etc.) — cas limite : **`watch-stop`** puis **`watch-up`**, ou en dernier recours : supprimer le volume **`web_api_node_modules`** puis relancer (voir [`../README.md`](../README.md) section Docker pour le nom exact du volume).
- **`./start.sh watch-up`** coupe d’abord **`api`** car **les deux exposent le même port hôte** — tu ne peux pas avoir **`api`** et **`api-watch`** actifs tous les deux sur ce mapping.

Pour **voir les logs en direct**, le script enchaîne **`docker compose logs -f api-watch`** après le **`up`**. Dans ce mode, **`Ctrl+C`** arrête généralement **uniquement l’affichage des logs** dans ton terminal ; les conteneurs **continuent** de tourner (vérifie avec **`docker compose -f compose.dev.yaml … ps`**). Pour tout arrêter : **`./start.sh watch-stop`** ou **`down`**.

---

### Shell interactif (`sh`) dans un conteneur

Les **`container_name`** du compose **dev** sont fixes : **`web-api`** (mode classique), **`web-api-watch`** (watch), **`web-api-mongodb`**, **`web-api-mongo-express`**.

Exemples (conteneurs **démarrés**) :

```bash
# API « compilation prod » dans l’image
docker exec -it web-api sh

# Mode watch — souvent entré en root au boot (pnpm, chown) ; intérêt : passer en user « node »
docker exec -it web-api-watch sh
docker exec -it -u node web-api-watch sh

# Mongo (shell mongosh plutôt que sh si besoin)
docker exec -it web-api-mongodb sh
```

- **`-it`** : pseudo‑TTY interactif pour ton clavier (**nécessaire** pour un shell lisible).
- Si **`sh`** n’existait pas dans une image très minimaliste : **`docker exec -it <conteneur> /bin/sh`** même principe. Les images utilisées ici (**Node Alpine**, **`node:24`**) fournissent **`sh`**.
- Quitter le shell : **`exit`** ou Ctrl+D.

Shell dans la stack **prod** : utilise le **`container_name`** défini dans `compose.prod.yml` (ex. **`web-api-prod`**) une fois **`docker compose … up`** lancé.

---

## Même comportement **sans** `start.sh` (commandes équivalentes)

Toujours **`cd server/docker`** d’abord.

### Développement — stack « classique » (**`api`** en image prod)

**Avec Mongo** (`DATABASE_NAME=MONGODB` dans `server/.env` ; adapter **`DATABASE_URL`** pour le conteneur, voir `.env.example`) :

```bash
docker compose -f compose.dev.yaml --profile mongodb up -d --build
```

**Sans Mongo** (ex. **`IN-MEMORY`** côté config, sans conteneurs Mongo) :

```bash
docker compose -f compose.dev.yaml up -d --build
```

Voir l’état :

```bash
docker compose -f compose.dev.yaml --profile mongodb ps    # avec Mongo
# ou sans --profile mongodb si pas de mongo
docker compose -f compose.dev.yaml ps
```

**Logs API uniquement** :

```bash
docker compose -f compose.dev.yaml --profile mongodb logs -f api
# sans mongo :
docker compose -f compose.dev.yaml logs -f api
```

**Stop** tous les services de cette stack compose (sans `down`) :

```bash
docker compose -f compose.dev.yaml --profile watch --profile mongodb stop
```

(Si vous n’utilisez jamais Mongo, retirez **`--profile mongodb`** — pour **`stop`** le script équivalent passe les deux profils pour tout couvrir.)

**Arrêt complet + réseau** (comme **`./start.sh down`**) :

```bash
# Si vous utilisiez Mongo + watch potentiel :
docker compose -f compose.dev.yaml --profile watch --profile mongodb down --remove-orphans

# Sans Mongo mais avec possibilité d’api-watch avant :
docker compose -f compose.dev.yaml --profile watch down --remove-orphans
```

**Sans volumes** : ajouter **`-v`** à **`down`**.

### Développement — mode **`watch`** (hot reload)

**Avec Mongo** :

```bash
docker compose -f compose.dev.yaml --profile watch --profile mongodb up -d --build mongodb mongo-express api-watch
docker compose -f compose.dev.yaml --profile watch --profile mongodb logs -f api-watch
```

**Sans Mongo** :

```bash
docker compose -f compose.dev.yaml --profile watch up -d --build api-watch
docker compose -f compose.dev.yaml --profile watch logs -f api-watch
```

**Arrêt watch** (équivalent grossier de **`watch-stop`**) :

```bash
docker compose -f compose.dev.yaml --profile watch --profile mongodb stop api-watch mongodb mongo-express
```

### **`dump-users`** sans script

Assurez-vous que la base existe et que **`web-api-mongodb`** tourne (nom du conteneur dans `compose.dev.yaml`) :

```bash
docker compose -f compose.dev.yaml --profile mongodb up -d mongodb
docker exec -i web-api-mongodb mongoimport --db bugbountyapp --collection users --jsonArray --drop < dump/user.json
```

(le chemin **`dump/user.json`** est relatif à **`server/docker/`**.)

### Production (**`compose.prod.yml`**)

Depuis **`server/docker/`**, avec un fichier **`.env`** à côté du compose contenant **`JWT_SECRET`**, **`MONGO_ROOT_PASSWORD`**, etc. :

```bash
docker compose -f compose.prod.yml --env-file .env up -d
```

Voir les commentaires en tête de **`compose.prod.yml`** (image **`ghcr.io/…`**, variables, absence d’exposition de Mongo sur l’hôte).

---

## Rappel rapide Dockerfile / contexte de build

- Build défini dans **`compose.dev.yaml`** : **`context: ..`** + **`dockerfile: docker/Dockerfile`** → contexte = dossier **`server/`**, fichier **`server/docker/Dockerfile`**.

---

## Références

- Compose dev : `compose.dev.yaml`
- Compose prod : `compose.prod.yml`
- Postgres (profil **`pg`**, y compris sans API : `docker compose … --profile pg up -d postgres pgweb`) : `compose.dev.yaml` et `compose.prod.yml`
- Script : `start.sh` • raccourci : `start`
