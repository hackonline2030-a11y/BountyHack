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
- `adapters/passport-jwt/guards/passport-jwt-auth.guard.ts`
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

## Schema 2FA (Prisma / Postgres uniquement pour la suite)

**Les prochaines etapes (flux 2FA, services, endpoints) ne ciblent que `DATABASE_NAME=POSTGRESQL_PRISMA`.**  
Les autres modes (Mongo, in-memory) restent possibles pour l'auth JWT de base, mais ne seront pas etendus en parallele pour la 2FA.

Le modele de donnees suit l'article [Designing Two-Factor Authentication That Scales](https://medium.com/@a_zeraibi/designing-two-factor-authentication-that-scales-a2f78fab65e4)
: table pivot `two_factor` (methode active + `verified`), table specifique `two_factor_totp` pour le secret TOTP.

- **Colonnes utilisateur conservees**: la table `users` existante (`id TEXT`, etc.) garde une seule addition : `two_factor_enabled BIGINT NOT NULL DEFAULT 0` (drapeau global a synchroniser avec la logique metier lorsque vous activerez le flux 2FA).
- **Enum `TwoFactorMethod`**: valeur `APP` (authentificateur TOTP comme dans l'article). Pour du passkey / WebAuthn plus tard : ajouter une valeur a l'enum **et** une table dediee credentiels ; pas de table passkey tant que la fonctionnalite n'existe pas.
- **DDL canonique**: `prisma/schema.prisma` + migration `prisma/migrations/20260508191300_two_factor_totp/migration.sql`. Appliquer avec `pnpm exec prisma migrate deploy` (et `prisma generate` si besoin). Le `PrismaService` continue de garantir au demarrage la table `users` + la colonne `two_factor_enabled` pour un dev rapide ; les tables `two_factor` / `two_factor_totp` viennent des migrations.
- **Mongo**: le champ optionnel `twoFactorEnabled` sur `MongoUser` reste un alignement documentaire seulement ; pas d'evolution 2FA prevue de ce cote pour l'instant.
- **Secrets en base (`two_factor_totp.secret`)** : en production le module d’enrollment persiste un **chiffrement** (AES-256-GCM, cle derivee via **scrypt** a partir de **`TOTP_ENCRYPTION_KEY`**, prefixe stocke **`v1:`**). Les anciennes lignes **sans** ce prefixe sont encore lues en clair (compat demopage sign-in).

### Activation TOTP avec JWT (parcours « Enable OTP »)

Uniquement **`DATABASE_NAME=POSTGRESQL_PRISMA`** + variable **`TOTP_ENCRYPTION_KEY`** (≥ 16 caracteres) dans **`server/.env`**, puis **redémarrer l’API**. Cette cle n’est **pas** un champ Bruno : le serveur seul l’utilise pour chiffrer les secrets en base. Flux calque sur l’article Medium (upsert `two_factor`, secret `otplib`, QR, verification, `verified`) :

1. `POST /api/auth/totp/enable/start` avec **`Authorization: Bearer <JWT>`**. Met a jour / cree `two_factor` (methode `APP`, `verified=false`), regenere le secret, enregistre le **texte chiffre** dans `two_factor_totp`. Reponse : **`secret`** (Base32, saisie manuelle), **`otpauthUri`**, **`secretQrCode`** (data URL pour le QR).
2. `POST /api/auth/totp/enable/confirm` avec le meme Bearer, corps `{ "code": "123456" }`. Verifie le TOTP (`otplib.verify`, tolerance `TOTP_EPOCH_TOLERANCE`), puis **`verified=true`** sur `two_factor` et **`two_factor_enabled`** = `1` sur `users`.

Fichiers principaux : `application/totp-enrollment.service.ts`, `adapters/totp/totp-secret-seal.ts`, `controllers/totp-enrollment.controller.ts`.

**Page demo dashboard (EJS)** pour enchainer login + start + confirm : `GET /api/dashboard/totp` (bouton aussi sur la page d’accueil `/api`).

### Page de démo (EJS) — liaison TOTP après mot de passe

Sous **`DATABASE_NAME=POSTGRESQL_PRISMA`** uniquement (flux proche [Logto — authenticator + Node](https://blog.logto.io/support-authenticator-app-verification-for-your-nodejs-app)) :

- **Page** : `GET /api/demo/totp-sign-in` (selon `GLOBAL_PREFIX`, par defaut prefix `api`).
- **1 — QR** : `POST /api/demo/totp-sign-in/step` corps comme `POST /api/auth/login` (`email`, `password`). Reponses **403** JSON : `missing_totp` + `secretQrCode` (data URL), ou `totp_verification_required` si le TOTP est **deja lie** (`verified=true`).
- **2 — Binder** : `POST /api/demo/totp-sign-in/verify` corps `email`, `password`, `code` (TOTP). Passe `two_factor.verified` a true et `users.two_factor_enabled` a `1`.
- **3 — Connexion** : `POST /api/demo/totp-sign-in/complete` meme corps ; renvoie le meme JSON que `POST /api/auth/login` (JWT) si mot de passe + TOTP sont valides.
- Issuer QR : **`TOTP_ISSUER`** (defaut `BugBountyApp`). **`TOTP_EPOCH_TOLERANCE`** pour `verify()` (defaut `30` secondes).

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
