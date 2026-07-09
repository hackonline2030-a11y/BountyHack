# BountyHack

Ce dépôt est un **monorepo** Git : une historique commune (`main`, branches `release/*`, `develop` / `srv/dev`, etc.), mais **plusieurs livrables indépendants** en production.

Merci de suivre les règles décidé sur le fichier des conventions :
**Branches, commits (Conventional Commits)** et scopes **`client` / `server` / `app`** : voir **[`CONVENTIONS.md`](CONVENTIONS.md)**.

## Contenu du dépôt

- **Frontend** : Next.js dans [`client/`](client/)
- **Backend** : API NestJS (workspace Nx) dans [`server/`](server/)

Documentation détaillée :

- [`CONVENTIONS.md`](CONVENTIONS.md) — branches, messages de commit, scopes monorepo
- [`client/README.md`](client/README.md) — CI : [`.github/workflows/client-ci.yml`](.github/workflows/client-ci.yml)
- [`server/README.md`](server/README.md) — CI : [`.github/workflows/server-ci.yml`](.github/workflows/server-ci.yml)
- Docker **optionnel** (dev local uniquement : **`start.sh`**, `docker compose`, Windows / WSL2) : [`server/docker/README.md`](server/docker/README.md) — **pas** la cible de déploiement production du projet (voir section ci-dessous).

## Installation

- **Backend (NestJS)** : section **Installation** dans [`server/README.md`](server/README.md)
- **Frontend (Next.js)** : section **Installation** dans [`client/README.md`](client/README.md)

Si tu développes sous **Windows**, pour lancer l’API avec les scripts bash (depuis **`server/`** : `./docker/start.sh`), privilégie **WSL2 + Docker Desktop** (intégration WSL activée).

## Mise en garde — assistants (Cursor, Claude, etc.) et fichiers `.env`

Les outils d’IA qui analysent le dépôt ou le chat peuvent **inclure dans leur contexte** le contenu de fichiers locaux (indexation, lecture à la demande, pièce jointe). Un fichier **`.env`** réel contient des **secrets** : considère qu’il peut être **exposé** à ces services selon ta configuration et tes usages (ouverture du fichier, mention `@`, copier-coller dans une conversation).

- **Ne pas** coller le contenu d’un `.env` dans une discussion avec un assistant.
- Pour documenter ou configurer : t’appuyer sur les **`*.env.example`** du dépôt (noms de variables, pas les valeurs secrètes).
- Ce projet limite l’exposition via **`.cursorignore`** et une règle Cursor (voir **`.cursor/rules/no-dotenv-read.mdc`**) : cela **réduit** le risque d’inclusion automatique, **sans garantie absolue**. La sécurité des secrets reste ta responsabilité (fichiers ignorés par Git, gestion des accès, pas de commit de secrets).
- Même ignoré par git ou les fichier ignore propre (et même en configurant son LLM), il restait possible selon certains utilisateur pour ce dernier d'accéder aux secrets du .env. Face à ce constat restons-en conscient en modifiant les clés API souvent par exemple ou en trouvant un système d'usage en isolation du LLM (à approfondir).

---

## Déploiement en production

Actuellement, nous sommes sur un VPS sur LWS pour une version de dev (serveur de dev pour les démos) :
- Séparation de `/client` et `/server` (même si présence sur le même hébergeur) : 2 processus.
- Branche qui pousse sur ce VPS : `srv/dev` (Je dois encore configurer la cont. délivery donc ça ne met pas en prod).

### Outils :
- pm2 est utilisé sur client et serveur [voir docs pm2](https://pm2.keymetrics.io/).
- Pas de docker (car trés exigeant sur la sécurité vu le rôle root ce qui ajoute une complexité inutile de sécurisation pour nous à ce stade).
- Github Actions : pas encore configuré mais présent sur une branche dédiée (configuration en cours + réflexion sécurité).
- Nginx et certificats ssl (cerbots).
- Git est présent sur le VPS

### Rôle de l’API (CORS, URL publique)

Une fois séparés, le front appelle l’API via une **URL HTTPS** dédiée au backend. Sur le serveur, `CORS_ORIGIN` (voir [`server/.env.example`](server/.env.example)) doit lister **l’origine exacte du front** en production (sans path), pour que le navigateur autorise les requêtes cross-origin.

## Sécurité et signalement

Voir [`SECURITY.md`](SECURITY.md) (politique de divulgation responsable, branches `main` / `release/*` / dev).
