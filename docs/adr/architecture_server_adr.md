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

### Alternatives envisagées

1. **Stocker le jeton de reset dans un JWT signé** — Rejeté. Un JWT n’est pas révocable côté serveur ; un attaquant qui intercepte le lien ne peut être stoppé qu’en attendant l’expiration. L’approche jeton opaque + hash SHA-256 en base permet une invalidation transactionnelle (consommation d’un jeton invalide les autres jetons pending du même utilisateur).
2. **Renvoyer le jeton brut dans la réponse HTTP de `password-reset/request`** — Rejeté. Casserait l’anti-énumération (un attaquant qui POST des emails apprendrait lesquels existent) et exposerait le secret hors du canal mail. Le lien et le jeton brut ne quittent jamais le serveur autrement que par l’email envoyé.
3. **Activer le module en mode `MONGODB` ou `IN-MEMORY`** — Rejeté. Demanderait des dépôts « no-op » qui mentiraient sur l’état du reset (succès silencieux sans persistance). Mieux : le module entier n’est enregistré que sous `DATABASE_NAME=POSTGRESQL_PRISMA`.
4. **Conserver les `refresh_tokens` actifs après reset** — Rejeté. Une réinitialisation est un signal fort de compromission probable du compte ; révoquer toutes les sessions longues côté API est la posture par défaut. Reconnecter coûte un login, garder des refresh ouverts coûterait potentiellement une chaîne complète de prises de contrôle.

### Statut

Accepted — **`PasswordResetController`** + commands + dépôt Prisma + port mail enregistrés sous `POSTGRESQL_PRISMA` uniquement ; jeton opaque, hash SHA-256 en base, TTL configurable, anti-énumération en place, `refresh_tokens` purgés après confirmation.

---

## Listing administratif des utilisateurs (`GET /users` super-admin)

Cette fonctionnalité illustre une **variante** des règles ci-dessus : quand une même table doit être lue **sous deux angles différents** (profil propre vs. supervision administrative), on duplique la **projection de lecture** sans introduire un nouvel agrégat de domaine.

### Read model séparé plutôt que `UserRecord` enrichi

**`UserRecord`** (pour `GET /users/me`) et **`UserAdminSummary`** (pour `GET /users`) coexistent volontairement :

- Les **consommateurs diffèrent** : l’utilisateur courant qui voit son propre profil vs. un `SUPER_ADMIN` qui supervise la collection.
- Les **champs pertinents diffèrent** : `roleCode` est utile au listing admin, étranger au profil propre ; à l’inverse, `twoFactorEnabled` n’a pas sa place dans le tableau de gestion.
- Les **invariants restent inchangés** — pas d’agrégat `UserDirectory` au sens DDD strict ; il s’agit de **deux projections** de la même table `users`.

Règle : dès que la prochaine surface a un consommateur **et** un set de champs différents, on **dédouble la projection** plutôt que d’élargir `UserRecord`. Le compilateur garantit alors qu’une colonne ajoutée à `users` (token, secret, hash, …) ne fuite que là où elle a été **explicitement** déclarée — allow-list, pas deny-list.

### Périmètre d’exécution

Comme pour la réinitialisation de mot de passe : **uniquement** lorsque **`DATABASE_NAME=POSTGRESQL_PRISMA`** porte la fonctionnalité, parce que les rôles RBAC vivent dans Postgres (`roles`, `users.role_id`). L’adaptateur Mongo lève `NotImplementedException` (501) — **pas** de stub silencieux qui renverrait un tableau vide et donnerait à l’admin l’illusion d’une base vierge. L’adaptateur in-memory renvoie `[]` pour les tests qui touchent au câblage sans toucher au domaine.

### Couches et fichiers

| Couche | Rôle | Fichiers (indicatifs) |
|--------|------|------------------------|
| **Domaine** | Inchangé : `UserAdminSummary` est un **read model de présentation**, pas une entité — aucun invariant métier ne s’y ajoute. | `users/models/user-admin-summary.model.ts` |
| **Ports** | Contrat étendu : `listAdminSummaries(): Promise<UserAdminSummary[]>` — l’extension force chaque mock Jest existant à déclarer la nouvelle méthode, ce qui sert d’alerte automatique lors de la revue. | `users/ports/user-repository.interface.ts` |
| **Application** | Use case mince au-dessus du port, sans connaissance HTTP/RBAC ; reste réutilisable depuis n’importe quel contrôleur ou job. | `users/queries/list-users-admin-summaries.query.ts` |
| **DTO HTTP** | `UserAdminSummaryDto` + enveloppe `UserAdminSummaryListResponseDto`. Le wrapping `{ items: [...] }` est délibéré : il permet d’ajouter plus tard `total`, `nextCursor`, etc. **sans casser** les clients existants. | `users/dto/user.dto.ts` |
| **Adapters** | Prisma : `select` strict + join `role.name` (anti-fuite + un seul round-trip SQL, pas de N+1). Coercion du `roles.name` à `null` si la valeur n’est pas dans l’enum applicatif — un libellé inattendu en base ne peut pas s’afficher tel quel dans l’UI. | `users/adapters/postgre-prisma/prisma-user-repository.ts`, stubs `in-memory` + `mongo` |
| **Contrôleur** | **`@AuthRoles(AppRoleCode.SUPER_ADMIN)`** (= `PassportJwtAuthGuard` puis `RolesGuard`) **est** la source de vérité d’autorisation pour cet endpoint. Tous les autres gardes (Next page gate, DAL) sont du confort UX et de la défense en profondeur ; **la barrière effective contre l’usurpation est ici.** | `users/controllers/users.controller.ts` |

### Sécurité (intention documentaire)

- **RBAC à la frontière HTTP, pas dans le chemin** : le décorateur recharge `roleCode` depuis Postgres `roles.name` à **chaque requête** via la stratégie JWT — une révocation de rôle en base prend effet à la requête suivante, sans attendre l’expiration du JWT. L’URL reste `/users`, pas `/admin/users` : la sécurité est dans le code (décorateur), pas dans la chaîne d’URL (« security by URL prefix » est un anti-pattern).
- **Projection au minimum vital** : `select` Prisma limité aux 4 colonnes nécessaires. Toute colonne sensible ajoutée plus tard à `users` reste hors de portée par défaut.
- **Double épure côté DTO** : `plainToInstance(..., { excludeExtraneousValues: true })` strip toute propriété non `@Expose()`d avant sérialisation — seconde barrière si un champ se glissait dans le payload retour.
- **Le client n’est pas la barrière** : la page Next `/{lng}/administration` applique `verifySessionForRoles([SUPER_ADMIN])` pour l’UX (404 immédiat, pas de fuite cognitive de l’existence de la route), mais le contrat de sécurité reste détenu par `@AuthRoles` côté Nest.

### Évolution possible

Les actions de modification à venir (`PATCH /users/:id/role`, `DELETE /users/:id`) s’instancieront sous la même couche : use cases dédiés + DTOs + même décorateur RBAC. À ce moment-là, des **règles métier** apparaîtront naturellement (« on ne supprime pas le dernier `SUPER_ADMIN` », « un super-admin ne peut pas modifier son propre rôle ») et **justifieront** l’introduction de services ou d’invariants de **domaine** côté `users` — au sens de la règle générale posée plus haut.

### Alternatives envisagées

1. **Élargir `UserRecord` pour y inclure `email` et `roleCode`** — Rejeté. Polluerait le modèle « profil propre » (`GET /users/me`) avec des champs utilisés uniquement par la supervision admin ; à terme, le compilateur ne pourrait plus garantir qu’une colonne sensible ajoutée à `users` ne fuite pas par `GET /users/me`. Mieux : deux projections distinctes pour deux consommateurs distincts.
2. **Stub `[]` sur l’adapter Mongo** — Rejeté. Un retour vide silencieux donnerait à un admin Mongo l’illusion d’une base vierge. On préfère lever `NotImplementedException` (501) pour échouer fort et signaler explicitement que la fonctionnalité n’est pas portée hors Postgres-Prisma à ce stade.
3. **Préfixer l’URL en `/admin/users`** — Rejeté. La garde est portée par le décorateur (`@AuthRoles(SUPER_ADMIN)`), pas par la chaîne d’URL. Préfixer ferait croire que la frontière de sécurité est implicite dans le routage — anti-pattern *« security by URL prefix »*. L’URL reste `/users` ; la RBAC est dans le code.
4. **Retourner un tableau JSON nu plutôt qu’`{ items: [...] }`** — Rejeté. Empêcherait d’ajouter plus tard `total`, `nextCursor`, `hasMore` etc. sans casser les clients existants. L’enveloppe est gratuite à l’écriture et garantit la rétro-compatibilité quand la pagination arrivera.
5. **Réutiliser `GetUserByIdQuery` en l’itérant côté contrôleur** — Rejeté. Donnerait du N+1 (une requête SQL par utilisateur pour résoudre `role.name`) et déplacerait de la logique de listing dans le contrôleur. Une query dédiée + un `findMany` avec join `role` reste l’option « un round-trip, projection allow-list ».

### Statut

Accepted — `GET /api/users` exposé avec `@AuthRoles(AppRoleCode.SUPER_ADMIN)`, alimenté par `ListUsersAdminSummariesQuery` au-dessus d’un port `IUserRepository.listAdminSummaries()`. Implémentation Postgres-Prisma uniquement (`select` strict + join `role.name`, coercion à `null` des rôles inconnus de l’enum applicatif) ; Mongo lève `NotImplementedException`, in-memory renvoie `[]`.
