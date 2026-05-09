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
