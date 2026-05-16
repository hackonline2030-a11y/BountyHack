# Instructions agents — frontend (`client/`)

**Règles monorepo communes** : **[`Agent.md`](../Agent.md)** à la racine (y compris **qualité logicielle** et **terminal / autorisation des commandes**) et **[`CONVENTIONS.md`](../CONVENTIONS.md)** (branches, commits, scopes **`client-<zone>`** pour tout ce qui vit ici).

## Contexte technique

- **Stack** : Next.js (App Router), **pnpm**, Prisma — détail des scripts, auth, i18n : **[`README.md`](README.md)**.
- **Variables** : ne documenter que via **[`.env.example`](.env.example)** ; pas de secrets dans le dépôt (voir aussi la mise en garde [`README.md`](../README.md) sur les assistants et les `.env`).

## Architectures logicielles à respecter

Nous mettons en place en front (client) comme en back (server) un système de clean architecture et nous empruntons certaines bonnes pratiques du Domain Driven Design. Il faut donc respecter et analyser cette architecture et faire des propositions cohérentes en rapport à ce système sans over-engeneering : en effet certains contenu static sans appel API ne sont pas mis dans un module en front par exemple. 

Voir les docs > adr pour plus d'information.

## Périmètre des changements

- **Par défaut** : rester sous **`client/`** ; ne pas modifier **`server/`** sauf besoin **transversal** (scope **`app`**, ou tâche explicite front + API).
- **Commits** : préfixe de scope du type **`client-<dossier-ou-zone>`** (kebab-case), pas un vague `client` seul — voir le tableau des scopes dans `CONVENTIONS.md`.

## Commandes utiles (depuis `client/`)

Exemples **indicatifs** ; **n’exécuter** des commandes dans le terminal **qu’avec accord explicite** — voir **[`Agent.md`](../Agent.md)** (*Terminal et commandes*).

```bash
pnpm install
pnpm dev
pnpm build
pnpm lint
```

Prisma / DB : voir la section *Environment variables* et *Scripts* dans **`README.md`**.
