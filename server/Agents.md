# Instructions agents — API (`server/`)

**Règles monorepo communes** : **[`Agents.md`](../Agents.md)** à la racine (y compris **qualité logicielle** et **terminal / autorisation des commandes**) et **[`CONVENTIONS.md`](../CONVENTIONS.md)** (branches, commits, scopes **`server-<zone>`** pour tout ce qui vit ici).

Toujours demander à l'utilisateur avant de lancer une commande. 
Ne jamais lancer un run sans demander à l'utilisateur

Bien respecter la clean architecture et les principes SOLID.
Prendre en compte les tests

**IMPORTANT** : les développement se font sur MYSQL_PRISMA donc sur les adapters mysql. Il n'est pas besoin d'intégrer sur postgre ou mongo à ce stade.

## Contexte technique

- **Stack** : NestJS, workspace **Nx** — cibles `serve`, `build`, `test`, `lint`, projet e2e : **[`README.md`](README.md)** (et **[`README.en.md`](README.en.md)** si besoin).
- **Variables** : **[`.env.example`](.env.example)** uniquement pour la forme ; pas de secrets versionnés.
- **Docker** : images et scripts sous **`docker/`** ; contexte de build = répertoire **`server/`** — **[`docker/README.md`](docker/README.md)**.

## Périmètre des changements

- **Par défaut** : rester sous **`server/`** ; ne pas modifier **`client/`** sauf travail **transversal** (scope **`app`**, ou tâche explicite).
- **Commits** : scope **`server-<dossier-ou-zone>`** (kebab-case) — détail dans `CONVENTIONS.md`.

## Commandes utiles (depuis `server/`)

Préférer les entrées **Nx** en équipe (`nx serve web-api`, etc.) — voir **`README.md`** pour les noms de projets et les équivalents pnpm. **N’exécuter** ces commandes **qu’avec accord explicite** — **[`Agents.md`](../Agents.md)** (*Terminal et commandes*).
