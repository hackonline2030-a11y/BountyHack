# Projet BountyHack — contexte Claude

**Instructions opérationnelles (tous agents)** : suivre d’abord **[`Agent.md`](Agent.md)** — hiérarchie, qualité (clean arch, **screaming architecture**, **DDD** / bounded contexts et langage ubiquitaire avec arbitrage, clean code, SOLID, patterns, remise en cause), terminal **sans** commande non autorisée, secrets, Git, worktrees.

**Travail surtout dans un sous-dossier** : consulter aussi **`client/Claude.md`** ou **`server/Claude.md`** — ils renvoient vers l’`Agent.md` local sans dupliquer les règles globales.

## Nuances utiles ici

- **Langue** : si l’utilisateur écrit en français, répondre en français ; les messages de commit restent en général **anglais** pour les `type(scope): …`, comme décrit dans `CONVENTIONS.md`.
- **Cohérence** : ne pas contredire `CONVENTIONS.md` / `README.md` ; en cas de conflit entre une supposition et ces fichiers, **privilégier les fichiers du dépôt**.
- **Fichier canonique** : peu de texte dans `Claude.md` — mettre à jour **`Agent.md`** (racine ou `client/` / `server/`) et **`CONVENTIONS.md`** / **`README.md`** pour les changements de règles.
- **Commandes** : ne pas lancer d’exécution shell sans feu vert explicite — voir la section *Terminal et commandes* dans **`Agent.md`**.
