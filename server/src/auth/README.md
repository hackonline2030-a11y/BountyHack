# Auth Module (`src/auth`)

Ce dossier contient la logique d'authentification Passport JWT de l'API.

Le mode d'auth actuel est unique :

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
- `FIREBASE` (Firestore)
- `IN-MEMORY`

Notes:

- `IN-MEMORY` est toujours compatible (sans persistance) pour les tests, et pour demarrer rapidement en local sans monter de base.
- Les modes PostgreSQL/MongoDB/Firebase sont persistants et dependent de la configuration d'environnement (`DATABASE_URL`, credentials, etc.).

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

## Regle d'architecture

Pipeline unique:

- En `PASSPORT_JWT`: utiliser uniquement guard/strategies Passport pour l'auth des requetes.

Toute nouvelle condition de mode doit passer par `config/auth-env.ts` (pas de check inline `process.env.AUTH_TYPE`).

## Tests (Passport uniquement)

La couverture auth actuelle cible le mode `PASSPORT_JWT` avec mocks/stubs (sans base reelle):

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

Quand une strategie n'est plus utile (ex: `FIREBASE`), proceder par etapes pour eviter les regressions:

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
- Verifier qu'il ne reste plus de references textuelles (`rg FIREBASE|firebase|FirebaseAuth`).

6) **Finaliser**
- Corriger naming/structure restants (fichiers devenus trompeurs).
- Laisser une architecture explicite: un port principal (`AuthRepository`) + adapters de la strategie active.

### Checklist concrete: retirer `FIREBASE` maintenant

1. **Code auth**
- Supprimer:
  - `src/auth/adapters/firebase-auth/firebase-auth.repository.ts`
  - `src/auth/adapters/firebase-auth/optional-firebase.module.ts`
  - `src/auth/firebase-auth.guard.ts`
  - `src/auth/firebase-auth.middleware.ts`
- Mettre a jour:
  - `src/auth/auth.module.ts` (retirer providers/imports Firebase et tout branch conditionnel Firebase)
  - `src/auth/auth.decorator.ts` (garder uniquement `PassportJwtAuthGuard`)
  - `src/core/app.module.ts` (retirer application du middleware Firebase)
  - `src/auth/config/auth-env.ts` (retirer `AUTH_TYPE=FIREBASE` et helpers associes)

2. **Configuration**
- Mettre a jour `server/.env.example`:
  - retirer toute option `AUTH_TYPE=FIREBASE`
  - retirer variables Firebase non utilisees

3. **Dependances**
- Dans `server/package.json`, retirer les packages Firebase devenus inutiles.
- Lancer `pnpm install` pour mettre a jour le lockfile.

4. **Documentation**
- Mettre a jour:
  - `server/README.md`
  - `src/auth/README.md` (ce fichier)
- Retirer toute mention de mode Firebase.

5. **Verification finale**
- Rechercher references restantes:
  - `rg "FIREBASE|firebase|FirebaseAuth" src`
- Lancer:
  - `pnpm exec nx run web-api:build`
  - tests auth Passport
- Verifier manuellement:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - route protegee `@Auth()`
