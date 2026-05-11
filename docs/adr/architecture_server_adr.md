# Architecture Decision Records — serveur NestJS

## Synthèse

Ce document décrit **l’intention et les limites** de l’app `bugbountyapp/server` pour que la structure en couches reste cohérente à mesure que les fonctionnalités évoluent.

### Domaine d’auth volontairement fin

La zone **`auth/domain`** reste volontairement petite. Elle expose aujourd’hui **`Identity`** (`uid`, `email`) — la forme minimale utile après vérification d’un jeton ou résolution d’un utilisateur par identifiant (par ex. guards, `getUserFromToken`, `getUserByUid`).

C’est **normal** lorsque ce contexte délimité gère surtout **la vérification des identifiants et l’émission de JWT**, tandis que les données utilisateur complètes (profil, persistance, parcours) vivent ailleurs ou dans l’infrastructure. On n’introduit des modèles de domaine plus riches que lorsque l’auth **porte les invariants ou le comportement** (verrouillage de compte, règles « e-mail vérifié » au sens métier, etc.), pas seulement pour refléter les colonnes de base.

### Application, domaine et HTTP

- **`auth/application`** — cas d’usage (**commands**) et interfaces de **ports** (`AuthRepository`). À la frontière application, on utilise des types simples comme **`RegisterWithPasswordInput`**, **`LoginWithPasswordInput`** et **`AuthenticatedSession`** (`token`, `user`, `require2FA` facultatif). Il s’agit d’**entrées / sorties de cas d’usage**, pas de « DTO Swagger » génériques réutilisables.
- **`auth/dto`** — classes de **requête / réponse réservées au HTTP** : validation (`class-validator`), OpenAPI (`@ApiProperty`). Les contrôleurs transforment le corps HTTP en entrées application (voir **`map-jwt-register-body`**) plutôt que d’associer les ports à des types de requête dupliqués.
- **`auth/adapters`** — Nest/Passport, dépôts Prisma/Mongo, signature JWT, mappeurs HTTP — **implémentent** les ports et parlent aux frameworks et à la persistance.

**`Identity`** et **`AuthenticatedSession.user`** (qui inclut **`username`**) peuvent donc diverger volontairement : l’un est le **principal post-vérification** pour l’autorisation ; l’autre est la **charge utile de session visible côté client** après connexion ou inscription. On les harmonise au cas par cas si les deux doivent représenter partout la même notion.

### Conséquences

- Pour tout nouveau comportement d’auth, préciser : **règle métier / invariant** → envisager le **domaine** ; **orchestration et types exposés aux ports** → **application** ; **contrat JSON** → **dto** + mappeur au niveau du contrôleur.
- Éviter de réintroduire des classes « DTO » parallèles pour la même action HTTP dans à la fois `dto/` et `application/` sans passer par un mapping à la limite HTTP.

---

## Réinitialisation de mot de passe (« forgot / reset »)

Cette fonctionnalité illustre les règles ci-dessus : **pas de nouveau modèle dans `auth/domain`** (pas d’agrégat « PasswordReset » au sens DDD strict) — les invariants portent surtout sur **l’absence de fuite d’information** (anti-énumération), **la durée de vie** et **l’usage unique** du jeton, gérés en **application** + **persistance Prisma**.

### Périmètre d’exécution

- **Uniquement** lorsque **`DATABASE_NAME=POSTGRESQL_PRISMA`** : le module enregistre `PasswordResetController`, les commandes, le dépôt Prisma et le port mail. Les modes Mongo / in-memory **ne** reçoivent **pas** ces routes (évite des implémentations de dépôt « no-op » trompeuses).

### Couches et fichiers

| Couche | Rôle | Fichiers (indicatifs) |
|--------|------|------------------------|
| **Domaine** | Inchangé : pas d’entité dédiée tant que les règles restent « jeton + e-mail + credential » sans vocabulaire métier partagé ailleurs. | — |
| **Ports** | Contrats stables : envoi transactionnel, persistance reset + transaction avec `users` / `refresh_tokens`. | `auth/ports/transactional-mail.port.ts`, `auth/ports/password-reset.repository.ts` |
| **Application** | Orchestration : demande (jeton opaque, hash, TTL, e-mail) ; confirmation (hash mot de passe, transaction). Types d’entrée simples (`RequestPasswordResetInput`, etc.), **pas** les DTO Swagger. | `auth/application/commands/request-password-reset.command.ts`, `complete-password-reset.command.ts` |
| **DTO HTTP** | Validation (`class-validator`) + **OpenAPI** (`@ApiProperty`, schémas de réponse). | `auth/dto/password-reset.dto.ts`, `password-reset-response.dto.ts` |
| **Adapters** | Prisma (`password_reset_tokens`), e-mail transactionnel : un fournisseur parmi **console / mailgun / brevo** (`MAIL_PROVIDER`) ; une seule clé **`MAIL_TRANSACTIONAL_API_KEY`** pour les backends qui l’exigent (+ **`MAILGUN_DOMAIN`** si Mailgun). | `auth/adapters/postgre/prisma-password-reset.repository.ts`, `auth/adapters/transactional-mail/*`, `transactional-mail.factory.ts` |
| **Config** | URL publique du front, locale du lien, TTL du jeton — hors domaine. | `auth/config/password-reset-public-url.ts`, `adapters/utils/password-reset-token-expiry.util.ts` |

Le **contrôleur** (`auth/controllers/password-reset.controller.ts`) ne fait que : valider le corps (DTO), appeler `execute({ ... })` avec des champs primitifs, renvoyer le corps HTTP de succès. **OpenAPI** : tag **`auth`**, `@ApiBody`, réponses typées (`PasswordResetRequestAcceptedDto`, `PasswordResetConfirmSuccessDto`), erreurs **400** / **503** / **500** documentées avec `HttpExceptionBodyDto` où pertinent.

### Sécurité (intention documentaire)

- **Anti-énumération** : `POST …/password-reset/request` renvoie toujours la même réponse de succès pour un corps valide ; aucune indication « compte inconnu ».
- **Pas de secret dans le JSON** : le lien et le jeton brut ne sont jamais renvoyés dans la réponse HTTP de la demande.
- **Jeton** : opaque, **hash SHA-256** en base (même utilitaire que les refresh opaques), TTL configurable, **une consommation** valide invalide les autres jetons pending du même utilisateur via la transaction.
- **Après confirmation** : toutes les lignes **`refresh_tokens`** de l’utilisateur sont supprimées (déconnexion effective des sessions longues côté API).

### Évolution possible

Si le produit exige des invariants métier réutilisables (ex. « compte verrouillé », « e-mail non vérifié » au sens juridique), introduire alors des **types ou services de domaine** dédiés plutôt que d’alourdir uniquement la couche application.
