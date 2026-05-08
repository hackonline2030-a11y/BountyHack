# Instructions agents — API (`server/`)

**Règles monorepo communes** : **[`Agent.md`](../Agent.md)** à la racine (y compris **qualité logicielle** et **terminal / autorisation des commandes**) et **[`CONVENTIONS.md`](../CONVENTIONS.md)** (branches, commits, scopes **`server-<zone>`** pour tout ce qui vit ici).

## Contexte technique

- **Stack** : NestJS, workspace **Nx** — cibles `serve`, `build`, `test`, `lint`, projet e2e : **[`README.md`](README.md)** (et **[`README.en.md`](README.en.md)** si besoin).
- **Variables** : **[`.env.example`](.env.example)** uniquement pour la forme ; pas de secrets versionnés.
- **Docker** : images et scripts sous **`docker/`** ; contexte de build = répertoire **`server/`** — **[`docker/README.md`](docker/README.md)**.

## Périmètre des changements

- **Par défaut** : rester sous **`server/`** ; ne pas modifier **`client/`** sauf travail **transversal** (scope **`app`**, ou tâche explicite).
- **Commits** : scope **`server-<dossier-ou-zone>`** (kebab-case) — détail dans `CONVENTIONS.md`.

## Commandes utiles (depuis `server/`)

Préférer les entrées **Nx** en équipe (`nx serve web-api`, etc.) — voir **`README.md`** pour les noms de projets et les équivalents pnpm. **N’exécuter** ces commandes **qu’avec accord explicite** — **[`Agent.md`](../Agent.md)** (*Terminal et commandes*).
