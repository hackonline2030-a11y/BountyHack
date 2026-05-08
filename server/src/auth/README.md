# Auth Module (`src/auth`)

Ce dossier contient la logique d'authentification de l'API.

L'architecture auth est extensible (via `AUTH_TYPE`) mais, a ce stade, l'implementation active est :

- `AUTH_TYPE=PASSPORT_JWT` (par defaut)

Il existe aussi un **2e axe de configuration** (independant de `AUTH_TYPE`) : `DATABASE_NAME`.

## Structure (refactor clean architecture leger)

- `domain/models/*` : modeles metier purs (ex: `Identity`).
- `ports/*` : contrats applicatifs (`AuthRepository`).
- `adapters/*` : adaptateurs techniques (Passport strategies, repositories par base, etc.).
- `adapters/http/*` : types lies a l'interface HTTP (ex: `RequestWithIdentity`).
- `application/*` : use cases (commands/queries) appeles par controllers/strategies/middlewares.

## Switch base de donnees (`DATABASE_NAME`)

Choix disponibles:

- `MONGODB`
- `POSTGRESQL` (SQL direct, sans Prisma)
- `POSTGRESQL_PRISMA` (PostgreSQL via Prisma ORM)
- `IN-MEMORY`

Notes:

- `IN-MEMORY` est toujours compatible (sans persistance) pour les tests, et pour demarrer rapidement en local sans monter de base.
- Les modes PostgreSQL/MongoDB sont persistants et dependent de la configuration d'environnement (`DATABASE_URL`, credentials, etc.).

## Comportement auth

### `PASSPORT_JWT`

Mode recommande pour l'auth email/mot de passe locale.

- `POST /api/auth/register` et `POST /api/auth/login` sont exposes via `PassportJwtAuthController`.
- Le login passe par `@UseGuards(AuthGuard('local'))` et `PassportJwtLocalStrategy`.
- Les routes protegees (`@Auth()`) passent par `PassportJwtAuthGuard` (`AuthGuard('jwt')`) et `PassportJwtStrategy`.
- Les infos utilisateur authentifie sont lues depuis `request.user` (payload injecte par Passport).

Fichiers principaux:

- `controllers/passport-jwt-auth.controller.ts`
- `adapters/passport-jwt/strategies/local/passport-jwt-local.strategy.ts`
- `adapters/passport-jwt/strategies/passport-jwt.strategy.ts`
- `passport-jwt-auth.guard.ts`
- `auth.decorator.ts`

Schema (`PASSPORT_JWT`) :

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

## Regle d'architecture

Pipeline actuel :

- Utiliser les guard/strategies Passport pour l'auth des requetes.

Toute nouvelle condition de configuration auth doit passer par `config/auth-env.ts` (pas de check inline `process.env.AUTH_TYPE`).

## Tests (Passport uniquement)

La couverture auth actuelle cible `PASSPORT_JWT` avec mocks/stubs (sans base reelle):

- `controllers/passport-jwt-auth.controller.spec.ts`
- `adapters/passport-jwt/strategies/local/passport-jwt-local.strategy.spec.ts`
- `adapters/passport-jwt/strategies/passport-jwt.strategy.spec.ts`

Valeurs fake utilisees dans ces tests:

- JWT fake:
  - `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.xcJlZ8F0eB_2oKeNlMJzr45UriVWk5hq80uOq2AMpcI`
- Secret fake:
  - `mon-lapin-caillousky-dans-la-serre`

Commande utile pour lancer uniquement ces tests:

```sh
pnpm exec nx run web-api:test --runInBand --testPathPattern=passport-jwt
```

## Retirer proprement une strategie d'auth

Quand une strategie n'est plus utile, proceder par etapes pour eviter les regressions:

1) **Geler la cible**
- Decider clairement la strategie restante (ex: `PASSPORT_JWT` uniquement).
- Lister les invariants a conserver: endpoints, payload token, guards, tests.

2) **Supprimer le switch de mode**
- Retirer la valeur obsolete dans `config/auth-env.ts`.
- Supprimer les helpers/conditions lies a cette strategie (`isXxxEnabled()`).
- Garder un seul wiring dans `AuthModule` pour la strategie restante.

3) **Retirer le pipeline technique**
- Supprimer adaptateurs/guards/middlewares specifiques a la strategie retiree.
- Retirer leurs imports/providers/controllers conditionnels dans les modules.
- Verifier `auth.decorator.ts` pour n'utiliser que le guard voulu.

4) **Nettoyer configuration et dependances**
- Enlever variables `.env` et `.env.example` non utilisees.
- Supprimer packages npm devenus inutiles (SDK/provider retire).
- Mettre a jour README (`server/README.md` et `src/auth/README.md`).

5) **Verifier l'impact applicatif**
- Build + tests unitaires auth.
- Test manuel minimal:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - une route protegee `@Auth()`
- Verifier qu'il ne reste plus de references textuelles de la strategie retiree.

6) **Finaliser**
- Corriger naming/structure restants (fichiers devenus trompeurs).
- Laisser une architecture explicite: un port principal (`AuthRepository`) + adapters de la strategie active.
