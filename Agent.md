# Instructions agents — BountyHack

Fichiers **à consulter avant un changement non trivial** (ne pas tout recopier ici — les lire) :

- **[`CONVENTIONS.md`](CONVENTIONS.md)** — branches, PR, rebase, **Conventional Commits**, scopes **`client-<zone>`** / **`server-<zone>`** / **`app`** (transversal uniquement).
- **[`README.md`](README.md)** — monorepo, prod client/serveur séparés, Docker **contexte `server/`**, GHCR = API seule.
- **[`SECURITY.md`](SECURITY.md)** — divulgation, branches sensibles.

## Carte du dépôt

| Zone | Chemin | Stack (résumé) |
|------|--------|----------------|
| Front | `client/` | Next.js — voir `client/README.md`, `client/.env.example` |
| API | `server/` | NestJS, Nx — voir `server/README.md`, `server/.env.example` |
| Conteneur API | `server/docker/` | Build depuis la racine **`server/`** — voir `server/docker/README.md` |

## Comportement attendu

- **Périmètre** : modifier seulement ce qui sert la demande ; pas de « nettoyage » large ou fichiers hors sujet.
- **Secrets** : jamais de clés réelles dans le dépôt ; noms et placeholders alignés sur les **`.env.example`**.
- **Git** : pas de commit direct sur `main` / `develop` (sauf exception doc minime décrite dans `CONVENTIONS.md`) ; messages et scopes conformes au fichier des conventions.
- **Worktrees** : pour plusieurs branches en parallèle, voir la section *Git worktrees* dans `CONVENTIONS.md`.

En cas de doute sur une règle d’équipe, **s’aligner sur `CONVENTIONS.md`** plutôt que d’inventer une convention locale.
