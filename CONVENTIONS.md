# Conventions — branches et commits (BountyHack)

## Sommaire (ultra-rapide)

- [TL;DR — Merge Policy](#tldr--merge-policy) — Quand utiliser `--no-ff` en 4 lignes.
- [Branches (rôles, sommairement)](#branches-rôles-sommairement) — Quelle branche pour quel type de travail.
- [Merges — `git merge` vs `git merge --no-ff`](#merges--git-merge-vs-git-merge---no-ff) — Règle d’équipe + cas d’usage.
- [Commits — Conventional Commits](#commits--conventional-commits) — Format standard des messages.
- [Scope dans ce dépôt](#scope-dans-ce-dépôt) — Choisir `(client)`, `(server)` ou `(app)` correctement.

## TL;DR — Merge Policy

- **`--no-ff`** pour les merges de **features / lots significatifs** via PR.
- **Merge classique** possible pour les **petits changements** (docs/chore/fix mineur).
- Utiliser `--no-ff` quand on veut une **traçabilité claire** et un **revert par bloc**.
- Rester pragmatique : historique lisible > règle rigide.

Ce document décrit le **nommage des branches** et les **Conventional Commits** pour ce monorepo. Le dépôt partage une historique commune (`main`, branches `release/*`, `develop` / `srv/dev`, etc.), avec des livrables indépendants en production.

## Pas de commit direct sur `main` ni sur `develop`

- **On ne pousse pas de travail directement sur `main`** : tout passe par une **branche dédiée** (`feature/…`, `fix/…`, etc.) puis une **pull request** (revue) avant merge.
- **On ne pousse pas non plus directement sur `develop`** : même principe — intégration via branche + PR.

**Exception (rare)** : commit **direct** sur `main` ou `develop` **uniquement** pour des changements **mineurs** et **très maîtrisés**, sans effet de bord sur le build ni sur l’équipe — en pratique **aucune modification de dépendances** (pas de `package.json` / `pnpm-lock.yaml` / `requirements`, pas de script d’install, pas de conteneur), typiquement une coquille dans un `.md`, un commentaire, un correctif de doc d’une ligne. Dès qu’il y a du code applicatif, une config, ou le moindre doute : **branche + PR**.

## Branches (rôles, sommairement)

| Branche | Rôle |
|--------|------|
| **`main`** | Branche par défaut, toujours déployable ou proche de la prod ; les PRs y convergent (GitHub Flow). |
| **`release/*`** | Ligne figée pour préparer ou corriger une version publiée sans mélanger la prochaine évolution de `main`. |
| **Branche de dev** (ex. `develop`) | Vivante tant qu'on a rien mis en prod définitive (release) ; intégration continue du travail avant le merge sur `main`. |
| **`srv/dev`** | Branche alignée sur le **serveur de développement** (déploiement de recette / environnement de dev partagé) : ce qui y est mergé reflète ce qui tourne sur la machine ou l’hôte de **dev** pour l’équipe, en dehors de `main` / `release/*`. |
| **`feature/<zone>-<sujet>`** | Travail de fonctionnalité à court terme ; **`zone`** = `client`, `server` ou `app` (transversal). |
| **`fix/<zone>-<sujet>`** | Correctifs ciblés (même idée de **`zone`**). |
| **`refactor/<zone>-<sujet>`** | Restructuration du code sans changement de comportement annoncé (même idée de **`zone`**). |
| **`experiment/<zone>-<sujet>`** | Explorations / POC ; pas garanties de merger telles quelles. |
| **`chore/…`**, **`docs/…`** | Maintenance (deps, CI), documentation seule. |

Les noms utilisent le **kebab-case** ; le détail du changement vit dans les commits et la PR.

## Merges — `git merge` vs `git merge --no-ff`

Référence : [Difference Between Git Merge and Git Merge --no-ff](https://hackr.io/blog/difference-between-git-merge-and-git-merge-no-ff)

### Règle d’équipe

Nous utilisons **`--no-ff` dans certains merges**, pas systématiquement.  
Objectif : garder un historique lisible quand une branche représente un vrai lot de travail, sans alourdir inutilement le graphe Git.

### Quand utiliser `--no-ff`

- Merge d’une **feature branch** ou d’un **lot métier significatif** via PR.
- Quand on veut **préserver explicitement le contexte** de la branche (discussion PR, commits associés).
- Quand on veut pouvoir **revert d’un bloc** (un commit de merge unique) si besoin.

### Quand éviter `--no-ff` (merge classique possible)

- Petits correctifs isolés, changements triviaux, docs/chore mineurs.
- Branches très courtes avec 1 commit clair, sans enjeu de traçabilité particulier.
- Merges techniques de synchronisation où un historique linéaire est préférable.

En pratique : **préférer `--no-ff` pour les merges structurants**, et rester pragmatique sur les petits changements.

## Commits — [Conventional Commits](https://www.conventionalcommits.org/)

Les messages suivent le préfixe **`type(scope optionnel): description`** (souvent en anglais pour l’outil, description claire en une ligne).

| Type | Usage typique |
|------|----------------|
| **`feat`** | Nouvelle fonctionnalité (dans les PRs **`feature/…`**). |
| **`fix`** | Correction de bug. |
| **`chore`** | Tâches sans impact produit direct (deps, config, scripts). |
| **`docs`** | Documentation uniquement. |
| **`refactor`**, **`test`**, **`perf`** | Au besoin, selon la nature du changement. |

### Scope dans ce dépôt

Le scope reflète le **dossier / périmètre** touché (pas un sous-domaine libre) :

| Scope dans le message | Quand l’utiliser |
|------------------------|-------------------|
| **`(client)`** | Changements centrés sur **`client/`** → par ex. `feat(client): add login form`, `fix(client): correct i18n hydration`, `refactor(client): extract auth hooks`. Idem pour **`fix`**, **`refactor`**, **`perf`**, **`test`**, **`chore`** si le cœur du diff est le front. |
| **`(server)`** | Changements centrés sur **`server/`** → par ex. `feat(server): expose PDF export route`, `fix(server): Mongo connection retry`. |
| **`(app)`** | **Uniquement** travail **transversal** : racine du repo (README, `.gitignore`, CI), ou modification coordonnée **`client/` + `server/`**, ou conventions qui englobent tout le monorepo. → par ex. `feat(app): add shared release workflow`, `chore(app): bump root tooling`. **Ne pas** mettre **`(app)`** pour un changement qui concerne **un seul** dossier : dans ce cas **`(client)`** ou **`(server)`**. |

Les branches **`feature/app-…`**, **`fix/app-…`**, **`refactor/app-…`** vont typiquement avec des commits **`…(app): …`** ; pour une branche **`feature/client-…`**, les commits utilisent **`…(client): …`** (et pareil **`server`**).

Exemple : `feat(server): add JWT refresh cookie` — **`feat`** est le type Conventional Commit ; la branche peut être **`feature/server-jwt-refresh`**.
