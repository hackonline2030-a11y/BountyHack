# Instructions agents — BountyHack

## Hiérarchie (éviter les doublons)

| Niveau | Rôle |
|--------|------|
| **Racine** (`Agent.md`, `CONVENTIONS.md`, `README.md`) | Règles **monorepo** communes : Git, scopes, secrets, déploiement. |
| **`client/Agent.md`** ou **`server/Agent.md`** | Détails **quand tu travailles surtout dans ce dossier** : stack, commandes, pièges locaux — sans recopier toute la convention Git. |
| **Règles Cursor** (`.cursor/rules/`, `.cursorignore`) | Transversal ; des règles **ciblées** (`globs`) peuvent s’ajouter plus tard pour un sous-dossier. |

**Ordre en cas de doute** : `CONVENTIONS.md` → `README.md` (racine) → `README.md` de la zone → `Agent.md` racine → `Agent.md` de la zone.

Fichiers **à consulter avant un changement non trivial** (ne pas tout recopier ici — les lire) :

- **[`CONVENTIONS.md`](CONVENTIONS.md)** — branches, PR, rebase, **Conventional Commits**, scopes **`client-<zone>`** / **`server-<zone>`** / **`app`** (transversal uniquement).
- **[`README.md`](README.md)** — monorepo, prod client/serveur séparés **sans Docker** ; Docker sous `server/docker/` = **dev local optionnel**.
- **[`SECURITY.md`](SECURITY.md)** — divulgation, branches sensibles.

## Carte du dépôt

| Zone | Chemin | Stack (résumé) |
|------|--------|----------------|
| Front | `client/` | Next.js — voir `client/README.md`, `client/.env.example` |
| API | `server/` | NestJS, Nx — voir `server/README.md`, `server/.env.example` |
| Docker (dev local) | `server/docker/` | Compose / `Dockerfile` — **optionnel** ; voir `server/docker/README.md` |

## Comportement attendu

- **Périmètre** : modifier seulement ce qui sert la demande ; pas de « nettoyage » large ou fichiers hors sujet.
- **Secrets** : jamais de clés réelles dans le dépôt ; noms et placeholders alignés sur les **`.env.example`**.
- **Git** : pas de commit direct sur `main` / `develop` (sauf exception doc minime décrite dans `CONVENTIONS.md`) ; messages et scopes conformes au fichier des conventions.
- **Worktrees** : pour plusieurs branches en parallèle, voir la section *Git worktrees* dans `CONVENTIONS.md`.
- **Documenter** : ne jamais écrire de documentation sans faire valider cela par l'utilisateur (pas de .md non sollicité par l'utilisateur).

## Qualité logicielle (viser le meilleur compromis)

Viser une base **propre et maintenable** ; les principes se complètent et se **limitent** aussi entre eux — un bon arbitrage vaut mieux qu’une application rigide ou décorative.

- **Clean architecture** : séparer domaine, infrastructure et présentation **là où le projet y gagne** (testabilité, indépendance des frameworks, limites de modules claires).
- **Screaming Architecture** : faire en sorte que l’arborescence et les modules **reflètent le métier / les capacités** du produit (« ce que fait l’app ») plutôt qu’un empilement anonyme de couches techniques seules.
- **DDD (Domain-Driven Design)** — **autant que le domaine le mérite** (pas de sur-ingénierie sur du CRUD trivial) :
  - **Bounded contexts** : délimiter des zones avec modèle et langage **cohérents** à l’intérieur ; éviter le « gros modèle partagé » qui mélange des sens métier incompatibles.
  - **Langage ubiquitaire** : aligner noms de code, dossiers et discussions sur le vocabulaire métier quand il existe.
  - **Autres idées utiles au besoin** : agrégats et frontières de cohérence transactionnelle ; **couche anti-corruption** / traduction explicite aux frontières entre contextes ou systèmes externes ; domain services là où la logique ne se rattache pas à une seule entité.
  - En cas de tension (simplicité vs modèle riche), **arbitrer** et documenter brièvement le choix si ce n’est pas évident pour un relecteur.
- **Clean code** : noms explicites, responsabilités courtes, duplication maîtrisée, erreurs et cas limites traités honnêtement.
- **SOLID** : les utiliser **autant que raisonnable** ; si deux principes tirent en sens contraires sur un point précis, **trancher** (et le signaler brièvement si ce n’est pas évident) plutôt que d’empiler des abstractions.
- **Design patterns** : les employer quand ils **clarifient** le modèle ou réduisent le risque ; pas pour illustrer un catalogue.
- **Remise en cause** : poser des questions utiles — hypothèses, périmètre, alternatives, risques (sécurité, perf, dette) — sans bloquer une petite tâche sous prétexte de théorie.

## Terminal et commandes

- **Ne pas exécuter** de commandes shell (`pnpm`, `nx`, `docker`, `git`, scripts, etc.) **sans accord explicite** de l’utilisateur pour **cette** exécution.
- **Préférer** : décrire ou proposer la commande ; n’appeler l’outil terminal **qu’après** un feu vert clair (« oui », « lance », « exécute ça », ou la demande formulée comme « run … » / « exécute … » pour une commande précise).
- Exception implicite : la consigne courante est **directement** « exécute telle commande » ou « lance les tests » — dans ce cas, la commande demandée est autorisée ; le reste (commandes annexes, pushes, installs globaux) reste soumis à confirmation si non demandé.

Quand la tâche est **centrée sur le front** ou **sur l’API**, lire aussi **[`client/Agent.md`](client/Agent.md)** ou **[`server/Agent.md`](server/Agent.md)** (contexte et commandes utiles pour cette zone).

En cas de doute sur une règle d’équipe, **s’aligner sur `CONVENTIONS.md`** plutôt que d’inventer une convention locale.
