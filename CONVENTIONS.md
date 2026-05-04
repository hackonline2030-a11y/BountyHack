# Conventions — branches et commits (BountyHack)

Ce document décrit le **nommage des branches** et les **Conventional Commits** pour ce monorepo. Le dépôt partage une historique commune (`main`, branches `release/*`, `develop` / `srv/dev`, etc.), avec des livrables indépendants en production.

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
