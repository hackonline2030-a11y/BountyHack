# Conventions — branches et commits (BountyHack)

Ce document décrit le **nommage des branches** et les **Conventional Commits** pour ce monorepo. Le dépôt partage une historique commune (`main`, branches `release/*`, `develop` / `srv/dev`, etc.), avec des livrables indépendants en production.

## Pas de commit direct sur `main` ni sur `develop`

- **On ne pousse pas de travail directement sur `main`** : tout passe par une **branche dédiée** (`feature/…`, `fix/…`, etc.) puis une **pull request** (revue) avant merge.
- **On ne pousse pas non plus directement sur `develop`** : même principe — intégration via branche + PR.

**Exception (rare)** : commit **direct** sur `main` ou `develop` **uniquement** pour des changements **mineurs** et **très maîtrisés**, sans effet de bord sur le build ni sur l’équipe — en pratique **aucune modification de dépendances** (pas de `package.json` / `pnpm-lock.yaml` / `requirements`, pas de script d’install, pas de conteneur), typiquement une coquille dans un `.md`, amélioration de la doc (commit en doc(readme):xxx), un commentaire, un correctif de doc d’une ligne. Dès qu’il y a du code applicatif, une config, ou le moindre doute : **branche + PR**.

## Si la branche n'est pas partagé, rebaser souvent sur `develop` ou sur `main`

(sur **ma** branche : git rebase main ou develop)

Rappel sur le fonctionnement du **rebase** et les cas limites : [**Introduction au Git Rebase** (DataCamp, FR)](https://www.datacamp.com/fr/tutorial/git-rebase).

Dans la mesure du possible, **mettre à jour régulièrement** ta branche de travail par **rebase** pour limiter les conflits au moment de la PR et rester aligné avec le flux du dépôt :

- Branche **issue de `develop`** (travail d’intégration vers la suite du cycle) : après `git fetch`, rebaser sur **`develop`**  
  `git rebase develop`  
  (ou `git rebase origin/develop` si tu ne trackes que le distant.)
- Branche **issue de `main`** (correctif ciblé, hotfix, branche alignée dès le départ sur `main`) : rebaser sur **`main`**  
  `git rebase main`  
  (même idée : `git fetch` puis rebase sur la branche de base choisie.)

### Push forcé, conflits, branches partagées

Un **rebase réécrit l’historique** de ta branche. Dès que tu as **déjà poussé** cette branche sur le remote, le prochain push des commits « rejoués » exige en général un **`git push --force-with-lease`** (et non un simple `git push`). C’est vrai en particulier si un rebase t’a fait **résoudre des conflits** : l’état local ne correspond plus à l’historique distant.

- **Branche perso / feature seule** : rebase + `--force-with-lease` est l’usage courant.
- **Branche partagée** (plusieurs personnes travaillent sur la même branche) : le rebase + push forcé peut **écraser** le travail d’autres commits déjà poussés → **à utiliser avec précaution** ; prévenir l’équipe, ou préférer un **`git merge develop`** / **`git merge main`** pour intégrer la base sans réécrire l’historique commun.

Si l’équipe préfère éviter le rebase sur les branches collaboratives, **`merge`** depuis `develop` / `main` reste acceptable ; l’important est de **rafraîchir souvent** pour ne pas livrer une PR avec des mois de retard sur la base.

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

Le **scope** est la partie entre parenthèses dans **`type(scope): description`**. Il doit être **précis**, pas un libellé vague.

**Travail sous `client/` ou `server/`** — forme attendue du commit :

```text
<type>(client-<dossier-ou-zone>): …
<type>(server-<dossier-ou-zone>): …
```

`<dossier-ou-zone>` = sous-partie du monorepo en **kebab-case** (module, dossier fonctionnel, couche concernée), pas seulement le mot **`client`** ou **`server`** tout seul.

**Travail transversal** : on **n’utilise pas** les préfixes **`client-…`** ni **`server-…`** dans le scope. On ne « précise pas la zone client ou serveur » : le commit est volontairement **sans coupure monorepo** — le scope est uniquement **`app`** (voir ligne du tableau ci‑dessous).

| Scope dans le message | Quand l’utiliser |
|------------------------|-------------------|
| **`client-<…>`** | Changements centrés sur **`client/`** → par ex. `feat(client-auth): add login form`, `fix(client-i18n): correct hydration`, `refactor(client-layout): extract header`. Même logique pour **`fix`**, **`refactor`**, **`perf`**, **`test`**, **`chore`** selon le cœur du diff. |
| **`server-<…>`** | Changements centrés sur **`server/`** → par ex. `feat(server-pdf): expose PDF export route`, `fix(server-mongo): connection retry`, `chore(server-deps): bump nest minor`. |
| **`app`** | **Uniquement** travail **transversal** (racine du repo, CI, ou **`client/` + `server/`** coordonnés). **Ne pas** ajouter de suffixe du type **`app-client`** ou **`app-server`** : ce n’est **pas** une zone `client-…` / `server-…` à détailler — rester sur **`feat(app): …`**, **`chore(app): …`**, **`docs(app): …`**, etc. **Ne pas** utiliser **`app`** si le changement ne touche qu’un seul des deux dossiers : dans ce cas **`client-<…>`** ou **`server-<…>`**. |

Les branches **`feature/app-…`** s’alignent avec des commits **`…(app): …`** ; une branche **`feature/client-auth-…`** va avec des scopes du type **`client-auth`**, **`client-i18n`**, etc.

Exemple : `feat(server-auth): add JWT refresh cookie` — la branche peut être **`feature/server-auth-jwt-refresh`**.
