# Auth Module (`src/auth`)

Ce dossier contient la logique d'authentification de l'API, avec un switch par variable d'environnement:

- `AUTH_TYPE=PASSPORT_JWT` (par defaut)
- `AUTH_TYPE=FIREBASE`

La selection du mode est centralisee dans `src/auth/config/auth-env.ts`.

Il existe aussi un **2e axe de configuration** (independant de `AUTH_TYPE`) : `DATABASE_NAME`.

## Structure (refactor clean architecture leger)

- `domain/models/*` : modeles metier purs (ex: `Identity`).
- `ports/*` : contrats applicatifs (`AuthRepository`).
- `adapters/*` : adaptateurs techniques (Firebase, JWT repository, Passport strategies).
- `adapters/http/*` : types lies a l'interface HTTP (ex: `RequestWithIdentity`).
- `application/*` : use cases (commands/queries) appeles par controllers/strategies/middlewares.

## Switch base de donnees (`DATABASE_NAME`)

Choix disponibles:

- `MONGODB`
- `POSTGRESQL` (SQL direct, sans Prisma)
- `POSTGRESQL_PRISMA` (PostgreSQL via Prisma ORM)
- `FIREBASE` (Firestore)
- `IN-MEMORY`

Notes:

- `IN-MEMORY` est toujours compatible (sans persistance) pour les tests, et pour demarrer rapidement en local sans monter de base.
- Les modes PostgreSQL/MongoDB/Firebase sont persistants et dependent de la configuration d'environnement (`DATABASE_URL`, credentials, etc.).

## Comportement par mode

### `PASSPORT_JWT`

Mode recommande pour l'auth email/mot de passe locale.

- `POST /api/auth/register` et `POST /api/auth/login` sont exposes via `PassportJwtAuthController`.
- Le login passe par `@UseGuards(AuthGuard('local'))` et `PassportJwtLocalStrategy`.
- Les routes protegees (`@Auth()`) passent par `PassportJwtAuthGuard` (`AuthGuard('jwt')`) et `PassportJwtStrategy`.
- Le middleware `FirebaseAuthMiddleware` n'est **pas** applique dans ce mode.
- Les infos utilisateur authentifie sont lues depuis `request.user` (payload injecte par Passport).

Fichiers principaux:

- `controllers/passport-jwt-auth.controller.ts`
- `adapters/passport-jwt-local.strategy.ts`
- `adapters/passport-jwt.strategy.ts`
- `passport-jwt-auth.guard.ts`
- `auth.decorator.ts`

Schema (mode `PASSPORT_JWT`):

```text
POST /api/auth/login
  -> AuthGuard('local')
  -> PassportJwtLocalStrategy.validate(email, password)
  -> AuthRepository.login(...)
  -> req.user = { token, user }
  -> PassportJwtAuthController.login() retourne req.user

Route protegee (@Auth)
  -> PassportJwtAuthGuard (AuthGuard('jwt'))
  -> PassportJwtStrategy.validate(payload JWT)
  -> AuthRepository.getUserByUid(...)
  -> req.user = { uid, email, ... }
  -> controller metier
```

### `FIREBASE`

Mode reserve aux tokens Firebase.

- Le provider `AuthRepository` pointe vers `FirebaseAuthRepository`.
- Le middleware `FirebaseAuthMiddleware` est applique globalement (dans `core/app.module.ts`) pour alimenter `request.user`.
- Le guard custom `FirebaseAuthGuard` verifie la presence de `request.user`.
- Les routes `register/login` email-mot de passe locales ne sont pas exposees.

Fichiers principaux:

- `adapters/firebase-auth.repository.ts`
- `firebase-auth.middleware.ts`
- `firebase-auth.guard.ts`

Schema (mode `FIREBASE`):

```text
Requete entrante
  -> FirebaseAuthMiddleware (global)
  -> extract Bearer token
  -> AuthRepository.getUserFromToken(...)
  -> req.user = { uid, email, ... } (ou null)
  -> @Auth() => FirebaseAuthGuard verifie req.user
  -> controller metier
```

## Regle d'architecture

Ne pas melanger les pipelines:

- En `PASSPORT_JWT`: utiliser uniquement guard/strategies Passport pour l'auth des requetes.
- En `FIREBASE`: utiliser le couple middleware + guard custom existant.

Toute nouvelle condition de mode doit passer par `config/auth-env.ts` (pas de check inline `process.env.AUTH_TYPE`).

## Tests (Passport uniquement)

La couverture auth actuelle cible le mode `PASSPORT_JWT` avec mocks/stubs (sans base reelle):

- `controllers/passport-jwt-auth.controller.spec.ts`
- `adapters/passport-jwt-local.strategy.spec.ts`
- `adapters/passport-jwt.strategy.spec.ts`

Valeurs fake utilisees dans ces tests:

- JWT fake:
  - `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.xcJlZ8F0eB_2oKeNlMJzr45UriVWk5hq80uOq2AMpcI`
- Secret fake:
  - `mon-lapin-caillousky-dans-la-serre`

Commande utile pour lancer uniquement ces tests:

```sh
pnpm exec nx run web-api:test --runInBand --testPathPattern=passport-jwt
```
