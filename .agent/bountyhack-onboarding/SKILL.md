---
name: bountyhack-onboarding
description: >-
  Orients agents on the BountyHack monorepo (client/server), conventions Git,
  MYSQL_PRISMA scope, and where to find shared instructions. Use when onboarding
  on the project, starting a new task, or when unsure which Agents.md or README
  to read first.
---

# BountyHack — onboarding agent

Skill d’exemple pour montrer la structure attendue dans `.agent/<nom-skill>/SKILL.md`.

## Quand utiliser ce skill

- Première tâche sur le dépôt
- Question « par où commencer ? »
- Doute sur le périmètre client vs server

## Ordre de lecture

1. [`Agents.md`](../../Agents.md) — règles monorepo
2. [`CONVENTIONS.md`](../../CONVENTIONS.md) — Git, commits, scopes
3. Zone concernée :
   - API → [`server/Agents.md`](../../server/Agents.md) + [`server/README.md`](../../server/README.md)
   - Front → [`client/Agents.md`](../../client/Agents.md) + [`client/README.md`](../../client/README.md)

## Règles clés (ne pas dupliquer ailleurs)

- **Périmètre** : rester dans la zone demandée (`client/` ou `server/`) sauf tâche transversale.
- **Base de données active** : `MYSQL_PRISMA` — pas d’extension Postgres/Mongo sauf demande explicite.
- **Secrets** : jamais de vraies clés ; s’appuyer sur les `*.env.example`.
- **Terminal** : ne pas exécuter de commande sans accord explicite de l’utilisateur.
- **Documentation** : ne pas créer de `.md` non sollicité.

## Activer ce skill dans ton outil

| Outil | Action |
|-------|--------|
| **Cursor** | `cp -r .agent/bountyhack-onboarding .cursor/skills/bountyhack-onboarding` |
| **Claude** | Importer ce `SKILL.md` dans les instructions projet, ou référencer [`Claude.md`](../../Claude.md) |

## Exemple de demande utilisateur

> « Je veux ajouter un endpoint API pour les rapports »

**Réponse attendue de l’agent :**
1. Lire `server/Agents.md` et `server/README.md`
2. Travailler sous `server/` uniquement
3. Proposer les commandes (Prisma, tests) sans les lancer sans accord
