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

## Configurer son LLM

Pour que les consignes projet soient bien prises en compte par un agent (LLM), ajoute une règle explicite dans ton outil et référence ces fichiers :
- [`Agents.md`](Agents.md)
- [`Claude.md`](Claude.md)
- [`server/Agents.md`](server/Agents.md)
- [`server/Claude.md`](server/Claude.md)
- [`client/Agents.md`](client/Agents.md)
- [`client/Claude.md`](client/Claude.md)

Tu peux aussi ajouter tes skills personnalisés dans des dossiers **`.agent/`** :

| Niveau | Emplacement | Quand l’utiliser |
|--------|-------------|------------------|
| **Monorepo** | `bugbountyapp/.agent/` | Règles transverses : Git, secrets, conventions communes |
| **Zone** | `server/.agent/`, `client/.agent/` | Skills API ou front (Nx, Prisma MySQL, i18n, auth BFF…) |
| **Module** (optionnel) | ex. `server/src/auth/.agent/` | Domaine complexe et autonome (auth, ip-access, pdf jobs) |

**Bonnes pratiques pour les autres devs qui ajoutent des skills :**
- **1 skill = 1 intention** (éviter un mega-skill « tout le server »).
- **Racine pour le cadre**, sous-dossiers pour l’expertise locale.
- **Ne pas dupliquer** les règles globales : les mettre une fois en racine, puis renvoyer vers [`Agents.md`](Agents.md) / [`Claude.md`](Claude.md) parent.
- **Nommer explicitement** : ex. `server-prisma-mysql`, `client-i18n`, `auth-jwt-flow`.
- **Structure** : un dossier par skill avec un `SKILL.md` (voir l’exemple [`.agent/bountyhack-onboarding/SKILL.md`](.agent/bountyhack-onboarding/SKILL.md)).

### Lecture automatique ?

**Non** — ni `Agents.md`, ni `Claude.md`, ni un skill dans `.agent/` ne sont lus automatiquement sans configuration.

| Outil | Instructions (`Agents.md` / `Claude.md`) | Skills |
|-------|------------------------------------------|--------|
| **Cursor** | Règle projet (`.cursor/rules/`), User Rules, ou `@Agents.md` dans le prompt | Chemin natif Cursor : **`.cursor/skills/<nom-skill>/SKILL.md`** (découverte via la `description` du frontmatter). Les skills partagés du dépôt vivent dans **`.agent/`** : les **copier** ou **symlinker** vers `.cursor/skills/` pour les activer localement. |
| **Claude** (Code, Desktop, etc.) | [`Claude.md`](Claude.md) + référence explicite dans les instructions projet | Reprendre le contenu des skills partagés dans **`.agent/`** (même `SKILL.md`) dans les instructions / project knowledge de Claude. Pas de lecture auto du dossier `.agent/` non plus. |

**Cursor — mise en route rapide :**
1. Lire [`Agents.md`](Agents.md) (règle ou `@`).
2. Pour un skill partagé : `cp -r .agent/<nom-skill> .cursor/skills/<nom-skill>` (ou symlink).
3. Les règles ciblées (ex. secrets `.env`) : déjà possibles via [`.cursor/rules/`](.cursor/rules/).

**Claude — mise en route rapide :**
1. Lire [`Claude.md`](Claude.md) (instructions projet).
2. Réutiliser les skills de **`.agent/`** en les important ou en renvoyant vers leur `SKILL.md`.

En pratique : **configurer explicitement** son agent ; le dépôt fournit les fichiers partagés, chaque dev les branche dans son outil.

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
