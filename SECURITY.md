# Politique de sécurité

Ce dépôt est un monorepo (**`client/`** — Next.js, **`server/`** — NestJS/Nx). Ce document explique comment signaler une vulnérabilité de façon responsable.

## Posture côté projet (déploiement et CI)

- **Production sans Docker** : le déploiement visé pour l’API n’est **pas** basé sur des images conteneurisées ni sur un registre d’images (type GHCR) — **y compris pour le serveur** : pas de flux projet de build/push d’image backend vers GHCR ou équivalent. L’objectif est une exécution **Node sur le serveur** (processus supervisé, reverse-proxy pour HTTPS, etc.), ce qui réduit la surface liée aux chaînes d’approvisionnement « image + registre + orchestrateur ». Le dossier **`server/docker/`** et les fichiers Compose associés servent au **développement local ou de lab**, de façon **optionnelle** ; ce n’est pas la cible de production du monorepo (voir le README racine).

- **Pas de Trivy dans la CI** : les workflows GitHub Actions **n’utilisent pas** Trivy ni l’action **`aquasecurity/trivy-action`**. Le choix est volontaire au regard des **risques supply chain** sur l’écosystème Trivy et les actions tierces (compromissions, tags réécrits, etc.). La sécurité du code et des dépendances repose sur d’autres leviers : revue de code, mises à jour de dépendances, tests et lint, **Gitleaks** pour la détection de secrets versionnés, et les bonnes pratiques GitHub sur les workflows (actions épinglées, moindre privilège des secrets).

Si vous évaluez une faille, précisez si elle concerne un **déploiement sans conteneur**, une **stack Docker locale**, ou la **CI** : le périmètre et la criticité peuvent différer.

## Où placer ce fichier ?

À la **racine du dépôt**, `SECURITY.md` est l’emplacement attendu par les plateformes (par ex. GitHub : onglet **Security** → politique visible). Une variante acceptée est `.github/SECURITY.md` ; la racine reste la plus courante et la plus visible.

## Branches et périmètre des correctifs

Le dépôt compte plusieurs lignes de vie ; indiquez **toujours** la branche, le tag (release) ou le hash de commit dans votre rapport.

- **`main`** — branche par défaut, intégration courante. Les correctifs de sécurité y sont appliqués en priorité.
- **Branches de release** — branches du type `release/…` (ou équivalent) alignées sur ce qui est déployé en production ou en préproduction. Si une faille concerne une version encore déployée depuis une telle branche, le correctif doit aussi y être porté (ou documenté) dans la mesure du possible.
- **Branche de développement** — branche utilisée pour l’environnement / le serveur de **dev** (nom exact selon le dépôt, par ex. `develop`). Les problèmes n’y apparaissant que là sont pris en compte ; la gravité peut être jugée différemment s’ils ne sont pas présents sur `main` ou sur une release encore supportée.

Si vous testez contre un environnement précis (**dev** vs **release** vs **production**), mentionnez-le : cela aide à prioriser le backport et la communication.

## Signaler une vulnérabilité

**Ne pas** ouvrir une issue publique pour un problème de sécurité sensible (ex. fuite de données, contournement d’auth, RCE).

À la place :

1. Utilisez **[Security advisories](https://docs.github.com/fr/code-security/security-advisories)** du dépôt (rapport **privé**) si la fonctionnalité est activée sur GitHub,  
   **ou**
2. Envoyez un courriel à **`[À REMPLACER : security@votredomaine.fr]`** avec l’objet contenant `[SECURITY] bugbountyapp`.

Indiquez dans le message :

- Description du problème et impact estimé
- Étapes de reproduction (sans action destructive)
- Composant concerné (`client`, `server`, les deux)
- Branche, tag de release et/ou hash de commit
- Environnement si pertinent (serveur de **dev**, **release**, **production**)

Vous pouvez proposer un chiffrement (PGP) si vous en fournissez une clé publique sur votre site ou dans le profil du dépôt.

## Ce que nous attendons des chercheurs

- Pas d’exploitation sur des environnements tiers sans autorisation écrite.
- Pas de téléchargement excessif de données, pas de déni de service intentionnel, pas de modification ou suppression de données d’autres utilisateurs.
- La divulgation coordonnée : ne publiez pas les détails avant qu’un correctif ou un plan de mitigation raisonnable soit en place (délai à discuter avec l’équipe).

## Délais de réponse (indicatifs)

- Accusé réception visé sous **5 jours ouvrés** (si le canal de signalement est surveillé).
- Première évaluation sous **~2 semaines** selon la charge et la gravité.

Ce ne sont pas des engagements contractuels ; ils servent à cadre de confiance avec les signaleurs.

## Hors périmètre (exemples)

- Problèmes théoriques sans scénario plausible d’exploitation
- Dépendances connues déjà corrigées dans une version plus récente (merci de joindre `pnpm-lock.yaml` / version exacte)
- Contenu des dépôts tiers, sauf impact direct et démontré sur **votre** déploiement de cette application

Merci de contribuer à la sécurité du projet.
