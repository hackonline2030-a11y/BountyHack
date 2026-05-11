# BountyHack

Ce dépôt est un **monorepo** Git : une historique commune (`main`, branches `release/*`, `develop` / `srv/dev`, etc.), mais **plusieurs livrables indépendants** en production.

Merci de suivre les règles décidé sur le fichier des conventions :
**Branches, commits (Conventional Commits)** et scopes **`client` / `server` / `app`** : voir **[`CONVENTIONS.md`](CONVENTIONS.md)**.

## Contenu du dépôt

- **Frontend** : Next.js dans [`client/`](client/)
- **Backend** : API NestJS (workspace Nx) dans [`server/`](server/)

Documentation détaillée :

- [`CONVENTIONS.md`](CONVENTIONS.md) — branches, messages de commit, scopes monorepo
- [`client/README.md`](client/README.md)
- [`server/README.md`](server/README.md)
- Docker **optionnel** (dev local uniquement : **`start.sh`**, `docker compose`, Windows / WSL2) : [`server/docker/README.md`](server/docker/README.md) — **pas** la cible de déploiement production du projet (voir section ci-dessous).

## Installation

- **Backend (NestJS)** : section **Installation** dans [`server/README.md`](server/README.md) — persistance **Postgres + Prisma** : section **Démarrage** → **PostgreSQL et Prisma** (Docker watch vs local).
- **Frontend (Next.js)** : section **Installation** dans [`client/README.md`](client/README.md)

Si tu développes sous **Windows**, pour lancer l’API avec les scripts bash (depuis **`server/`** : `./docker/start.sh`), privilégie **WSL2 + Docker Desktop** (intégration WSL activée) et suis ce guide : évite les incohérences avec PowerShell pur et les chemins sous **`C:\`** seuls pour le mode watch Docker.

## Mise en garde — assistants (Cursor, Claude, etc.) et fichiers `.env`

Les outils d’IA qui analysent le dépôt ou le chat peuvent **inclure dans leur contexte** le contenu de fichiers locaux (indexation, lecture à la demande, pièce jointe). Un fichier **`.env`** réel contient des **secrets** : considère qu’il peut être **exposé** à ces services selon ta configuration et tes usages (ouverture du fichier, mention `@`, copier-coller dans une conversation).

- **Ne pas** coller le contenu d’un `.env` dans une discussion avec un assistant.
- Pour documenter ou configurer : t’appuyer sur les **`*.env.example`** du dépôt (noms de variables, pas les valeurs secrètes).
- Ce projet limite l’exposition via **`.cursorignore`** et une règle Cursor (voir **`.cursor/rules/no-dotenv-read.mdc`**) : cela **réduit** le risque d’inclusion automatique, **sans garantie absolue**. La sécurité des secrets reste ta responsabilité (fichiers ignorés par Git, gestion des accès, pas de commit de secrets).
- Même ignoré par git ou les fichier ignore propre (et même en configurant son LLM), il restait possible selon certains utilisateur pour ce dernier d'accéder aux secrets du .env. Face à ce constat restons-en conscient en modifiant les clés API souvent par exemple ou en trouvant un système d'usage en isolation du LLM (à approfondir).

---

## Déploiement en production : client et serveur sont séparés

### Même branche Git ne veut pas dire « un seul paquet en prod »

Sur une branche donnée (`main` ou une `release/*`), le commit est **unique**, mais tu peux (et en général tu dois) :

- **compiler et publier le front** depuis `client/` vers sa cible (ex. CDN + `next start`, hébergement Node, autre),
- **compiler et publier l’API** depuis `server/` vers sa cible (ex. **VPS : Node + systemd + reverse-proxy**, PaaS managé, autre) **sans obligation de conteneur**,

sans mélanger les deux dans un seul artefact. Chaque pipeline ne prend que le dossier et les fichiers dont il a besoin.

### Pourquoi séparer ?

- **Cycle de vie différent** : redéployer le front sans toucher au back, ou inversement.
- **Mise à l’échelle** : le front est souvent statique / CDN ; l’API consomme CPU, DB, secrets.
- **Sécurité** : secrets backend (JWT, Mongo, Firebase…) restent côté serveur ; le navigateur ne voit que les variables `NEXT_PUBLIC_*` et les appels HTTP vers l’API.

### Rôle de l’API (CORS, URL publique)

Une fois séparés, le front appelle l’API via une **URL HTTPS** dédiée au backend. Sur le serveur, `CORS_ORIGIN` (voir [`server/.env.example`](server/.env.example)) doit lister **l’origine exacte du front** en production (sans path), pour que le navigateur autorise les requêtes cross-origin.

---

## Production : **sans Docker** (cible du projet)

Le déploiement visé est **classique** : build (`pnpm build` / `nx build`), transfert des artefacts sur le serveur (rsync, CI SSH, etc.), processus **Node** sous **systemd** (ou équivalent), **reverse-proxy** (nginx, Caddy) pour HTTPS et le routage.

**Pas d’image Docker « officielle » du serveur** et **pas de GitHub Container Registry (GHCR)** dans le périmètre du projet : l’API **n’est pas** livrée par *pull* d’image depuis un registre, et il n’y a **pas** de workflow ou de convention de build/push vers `ghcr.io/…` pour le backend. Le [`server/docker/Dockerfile`](server/docker/Dockerfile) sert uniquement à **reproduire un runtime** en **local ou lab** (éventuel `docker build` sur ta machine, éventuellement avec `compose.lab.yml`) ; ce n’est **ni** l’artefact de déploiement production **ni** une chaîne de publication vers un registre.

**Docker / `server/docker/`** restent utiles **en local** (API + Postgres + watch, WSL, etc.) — voir [`server/docker/README.md`](server/docker/README.md).

---

## Sécurité et signalement

Voir [`SECURITY.md`](SECURITY.md) (politique de divulgation responsable, branches `main` / `release/*` / dev).
