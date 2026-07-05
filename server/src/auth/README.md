# Auth Module (`src/auth`)

Ce dossier contient la logique d'authentification de l'API.

L'architecture auth est extensible (via `AUTH_TYPE`) mais, a ce stade, l'implementation active est :

- `AUTH_TYPE=PASSPORT_JWT` (par defaut)

Il existe aussi un **2e axe de configuration** (independant de `AUTH_TYPE`) : `DATABASE_NAME`.

## Structure (refactor clean architecture leger)

- `domain/models/*` : modeles metier purs (ex: `Identity`).
- `ports/*` : contrats applicatifs (`AuthRepository`, symbole `REFRESH_TOKEN_REPOSITORY` + `IRefreshTokenRepository`).
- `adapters/*` : adaptateurs techniques (Passport strategies, repositories par base, etc.).
- `adapters/http/*` : aide HTTP (`RequestWithIdentity`, cookie refresh `jwt-refresh-cookie.ts`, corps JSON sans refresh `jwt-auth-access-response.ts`, map inscription `map-jwt-register-body.ts`).
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

- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh` et `POST /api/auth/logout` sont exposes via `PassportJwtAuthController`.
- **PostgreSQL + Prisma uniquement** : `POST /api/auth/password-reset/confirm` via `PasswordResetController` (jeton e-mail super-admin : invitation ou renouvellement). Pas de demande publique « mot de passe oublié ».
- Le login passe par `@UseGuards(AuthGuard('local'))` et `PassportJwtLocalStrategy`.
- `POST /api/auth/login` accepte aussi un champ optionnel `code` (TOTP 6-8 chiffres) pour les comptes avec 2FA activée.
- Les routes protegees (`@Auth()`) passent par `PassportJwtAuthGuard` (`AuthGuard('jwt')`) et `PassportJwtStrategy`.
- RBAC minimal : `rbac/roles.decorator.ts` (`@Roles`, `AuthRoles(...)`), `rbac/roles.guard.ts`. Ex. `POST /api/auth/register` exige `AuthRoles(AppRoleCode.SUPER_ADMIN)` + Bearer. `Identity.roleCode` est hydrate depuis Prisma (`user.role.name`) dans `PostgrePrismaPassportJwtRepository.getUserByUid`. Les lignes `roles` en base viennent du **seed** (`pnpm prisma:seed`, `prisma/seed/roles.sql`), pas des migrations applicatives.
- Les infos utilisateur authentifie sont lues depuis `request.user` (payload injecte par Passport : `Identity`).

Fichiers principaux:

- `controllers/passport-jwt-auth.controller.ts`
- `adapters/passport-jwt/strategies/local/passport-jwt-local.strategy.ts`
- `adapters/passport-jwt/strategies/passport-jwt.strategy.ts`
- `adapters/passport-jwt/guards/passport-jwt-auth.guard.ts`
- `auth.decorator.ts`

Schema (`PASSPORT_JWT`) — resume :

```text
POST /api/auth/register | login
  -> RegisterWithPasswordCommand | AuthGuard('local') + PassportJwtLocalStrategy
  -> AuthRepository (signe JWT access court + persiste refresh opaque + ... )
  -> Set-Cookie: refresh httpOnly (path /api/auth, voir aussi clear legacy `/api/auth/refresh` au logout)
  -> JSON au client : { token, user, require2FA? } (pas de champ refresh dans le corps)

POST /api/auth/refresh
  -> cookie refresh opaque
  -> RefreshAccessTokenQuery -> AuthRepository.refreshAccessToken (DB : rotation)
  -> nouveau cookie + meme forme JSON { token, user, ... }

POST /api/auth/logout
  -> cookie refresh opaque (idem path /api/auth)
  -> LogoutSessionCommand (revoke en base si present)
  -> Clear-Cookie refresh (path courant `/api/auth` + path legacy `/api/auth/refresh`)

Route protegee (@Auth)
  -> PassportJwtAuthGuard (Bearer : JWT access)
  -> PassportJwtStrategy -> AuthRepository.getUserByUid(...)
  -> req.user = Identity (adapter metier), pas la session login complete
```

---

## JWT — access VS refresh opaque (fil minimal en prod progressive)

Section dediee : ce que le module fait aujourd’hui pour le couple **JWT access** / **refresh** et **pourquoi**.

### Access JWT (court)

- Signe avec **`JWT_SECRET`**, duree **`JWT_EXPIRES_IN`** (`jsonwebtoken` / `expiresIn`, ex. `15m`).
- Transport client : convention **`Authorization: Bearer <token>`** sur les routes protegees (`PassportJwtStrategy`).

### Refresh opaque (long) — pas un second JWT

**Choix d’archi** :

- Valeur aleatoire cote serveur (**opaque**), stockee en base **unique par hash SHA-256** (`token_hash` / Mongo `tokenHash`).
- TTL alignee avec **`JWT_REFRESH_EXPIRES_IN`** lors de la persistance et du `Set-Cookie` (`max-age` derive de la meme regle dans `opaque-refresh-token.util.ts`).
- **Rotation stricte** a chaque POST `/auth/refresh` : validation + `last_used_at`, puis **suppression de la ligne** du jeton utilise avant d’emettre une nouvelle paire opaque + nouveau cookie (meme comportement fonctionnel que l’article “delete old refresh”).

Pourquoi ne pas garder uniquement un long JWT comme refresh ?
- Une base **avec revocation / rotation par jeton** est un pattern courant associe a une **fenetre courte** pour l’access JWT ; permet **logout reel** (`DELETE`/revocation), limite replay apres substitution, audit (`last_used_at`).

Pourquoi ne pas garder les secrets refresh en JSON ?
- Réponse HTTP **`JwtAuthResponseDto`** : uniquement **`token` + `user` + require2FA** facultatif ; le navigateur doit utiliser **`credentials: 'include'`** pour recevoir le cookie (**`cookie-parser`** est enregistre dans `main.ts`).
- Attrait securise : **`httpOnly`**, **`Secure` si `NODE_ENV=production`**, **`SameSite=lax`** (ajustement possible si sous-domaines / SPA distante HTTPS).
- **`Path`** du cookie : **`/{GLOBAL_PREFIX}/auth`** (defaut **`/api/auth`**) — le navigateur l’envoie sur **`POST …/auth/login`**, **`POST …/auth/refresh`** et **`POST …/auth/logout`** (revocation du refresh). Les clients qui avaient encore l’ancien path **`/auth/refresh`** recoivent aussi un **`Clear-Cookie`** sur ce path legacy a la deconnexion.

- **Deconnexion** : **`POST /auth/logout`** avec **`credentials: 'include'`** : suppression en base du hash du jeton opaque courant (si cookie present), **`clearCookie`** sur le path courant **et** le path legacy, puis le client Next doit appeler **`DELETE /api/session`** pour effacer le cookie access court.

### Ports / use cases (inversion de dependance)

| Frontiere | Role |
|-----------|------|
| `AuthRepository` | register/login/refresh JWT access + orchestration opaque attache apres inscription cote facade `PassportJwtAuthRepository`. |
| `REFRESH_TOKEN_REPOSITORY` / `IRefreshTokenRepository` | persistance Postgres **Prisma**, **Mongo**, ou **in-memory** selon `DATABASE_NAME`. |
| `RefreshAccessTokenQuery` | use case utilise par le controller HTTP `/auth/refresh`. |
| `LogoutSessionCommand` | revocation du refresh opaque pour le cookie courant (`POST /auth/logout`). |
| `PassportJwtTokenService` | **uniquement** verification / emission du JWT **access**. |
| `PASSWORD_RESET_REPOSITORY` / `IPasswordResetRepository` | jeton opaque setup / reset admin (hash SHA-256), table **`password_reset_tokens`**, transaction avec `users` + `refresh_tokens`. **Prisma SQL** (`POSTGRESQL_PRISMA` / `MYSQL_PRISMA`). |
| `TRANSACTIONAL_MAIL_PORT` / `ITransactionalMailPort` | envoi e-mail : un fournisseur actif via **`MAIL_PROVIDER`** (`console` \| `mailgun` \| `brevo` \| `smtp`) ; clé **`MAIL_TRANSACTIONAL_API_KEY`** pour Mailgun/Brevo ; **`SMTP_HOST`**, **`SMTP_USER`**, **`SMTP_PASSWORD`** pour SMTP (ex. LWS). |
| `IssuePasswordSetupTokenService`, `RegisterUserByAdminCommand`, `ResendUserInvitationCommand`, `AdminForcePasswordResetCommand` | émission du jeton + lien e-mail (invitation `?flow=setup` ou renouvellement). |
| `CompletePasswordResetCommand` | valide le jeton, met à jour le mot de passe, supprime **toutes** les lignes `refresh_tokens` de l’utilisateur. |

Adaptateurs infra : sous `adapters/passport-jwt/repositories/*` (dont `*-refresh-token.repository.ts`, `*-passport-jwt.repository.ts`). Table Prisma **`refresh_tokens`** (migration dediee) + DDL bootstrap facultatif dans `PrismaService` pour DB legacy.

### Reinitialisation / activation mot de passe (Prisma SQL)

- **Emission du lien** : super-admin uniquement (`RegisterUserByAdminCommand`, `ResendUserInvitationCommand`, `AdminForcePasswordResetCommand`) — pas d’endpoint public par e-mail.
- **`POST /api/auth/password-reset/confirm`** (`PasswordResetController`) — corps `{ "token": "…", "password": "…" }` (mot de passe min. 8 caracteres). Transaction : jeton valide + non expire → suppression des jetons reset, mise à jour **`password_hash`** (scrypt), suppression des **`refresh_tokens`**.

Liens client : **`CLIENT_PUBLIC_BASE_URL/{locale}/password-reset?token=…`** (renouvellement) ou **`…&flow=setup`** (premier mot de passe).

**Fichiers** : `controllers/password-reset.controller.ts`, `application/commands/complete-password-reset.command.ts`, `application/commands/admin-force-password-reset.command.ts`, `application/commands/register-user-by-admin.command.ts`, `application/commands/resend-user-invitation.command.ts`, `application/services/issue-password-setup-token.service.ts`, `adapters/postgre/prisma-password-reset.repository.ts`, `config/password-reset-public-url.ts`, `config/account-setup-public-url.ts`.

### Configuration (auth + env serveur)

- **`JWT_REFRESH_EXPIRES_IN`** : TTL commun persistance cookie + lignes refresh.
- **`JWT_REFRESH_COOKIE_NAME`** (voir `config/auth-env.ts`) : nom du cookie (defaut `refresh_token`).
- CORS Nest : **`credentials: true`** des que l’origine n’est pas `*` — le client Next utilise deja **`credentials: 'include'`** dans `client/lib/auth-api.ts` ; helper **`postAuthRefresh()`** pour `POST …/auth/refresh`.

---

## Schema 2FA (Prisma / Postgres uniquement pour la suite)

**Les prochaines etapes (flux 2FA, services, endpoints) ne ciblent que `DATABASE_NAME=POSTGRESQL_PRISMA`.**  
Les autres modes (Mongo, in-memory) restent possibles pour l'auth JWT de base, mais ne seront pas etendus en parallele pour la 2FA.

Le modele de donnees suit l'article [Designing Two-Factor Authentication That Scales](https://medium.com/@a_zeraibi/designing-two-factor-authentication-that-scales-a2f78fab65e4)
: table pivot `two_factor` (methode active + `verified`), table specifique `two_factor_totp` pour le secret TOTP.

- **Colonnes utilisateur conservees**: la table `users` existante (`id TEXT`, etc.) garde une seule addition : `two_factor_enabled BIGINT NOT NULL DEFAULT 0` (drapeau global a synchroniser avec la logique metier lorsque vous activerez le flux 2FA).
- **Enum `TwoFactorMethod`**: valeur `APP` (authentificateur TOTP comme dans l'article). Pour du passkey / WebAuthn plus tard : ajouter une valeur a l'enum **et** une table dediee credentiels ; pas de table passkey tant que la fonctionnalite n'existe pas.
- **DDL canonique**: `prisma/schema.prisma` + migration `prisma/migrations/20260508191300_two_factor_totp/migration.sql`. Appliquer avec `pnpm exec prisma migrate deploy` (et `prisma generate` si besoin). Le `PrismaService` continue de garantir au demarrage la table `users` + la colonne `two_factor_enabled` pour un dev rapide ; les tables `two_factor` / `two_factor_totp` viennent des migrations.
- **Mongo**: le champ optionnel `twoFactorEnabled` sur `MongoUser` reste un alignement documentaire seulement ; pas d'evolution 2FA prevue de ce cote pour l'instant.
- **Secrets en base (`two_factor_totp.secret`)** : en production le module d’enrollment persiste un **chiffrement** (AES-256-GCM, cle derivee via **scrypt** a partir de **`TOTP_ENCRYPTION_KEY`**, prefixe stocke **`v1:`**). Les anciennes lignes **sans** ce prefixe sont encore lues en clair (migration progressive).

### Activation TOTP avec JWT (parcours « Enable OTP »)

Uniquement **`DATABASE_NAME=POSTGRESQL_PRISMA`** + variable **`TOTP_ENCRYPTION_KEY`** (≥ 16 caracteres) dans **`server/.env`**, puis **redémarrer l’API**. Cette cle n’est **pas** un champ Bruno : le serveur seul l’utilise pour chiffrer les secrets en base. Flux calque sur l’article Medium (upsert `two_factor`, secret `otplib`, QR, verification, `verified`) :

1. `POST /api/auth/totp/enable/start` avec **`Authorization: Bearer <JWT>`**. Met a jour / cree `two_factor` (methode `APP`, `verified=false`), regenere le secret, enregistre le **texte chiffre** dans `two_factor_totp`. Reponse : **`secret`** (Base32, saisie manuelle), **`otpauthUri`**, **`secretQrCode`** (data URL pour le QR).
2. `POST /api/auth/totp/enable/confirm` avec le meme Bearer, corps `{ "code": "123456" }`. Verifie le TOTP (`otplib.verify`, tolerance `TOTP_EPOCH_TOLERANCE`), puis **`verified=true`** sur `two_factor` et **`two_factor_enabled`** = `1` sur `users`.
3. `POST /api/auth/totp/disable` avec le meme Bearer, corps `{ "code": "123456" }`. **Step-up obligatoire**: verifie un code TOTP courant, puis supprime les secrets/rows TOTP (`two_factor_totp`, `two_factor`) et repasse **`two_factor_enabled`** = `0` sur `users`.

### Login + TOTP (2-step)

Quand `users.two_factor_enabled = 1` (Postgres Prisma), le login mot de passe seul ne suffit plus:

1. `POST /api/auth/login` avec `{ email, password }` -> `401` si code absent (`TOTP code required`).
2. `POST /api/auth/login` avec `{ email, password, code }` -> verification `otplib` sur le secret TOTP actif.
3. Si code valide: JWT access + refresh opaque emis comme le flux standard.

Pour les comptes sans TOTP (`two_factor_enabled = 0`), le login reste inchangé (email + password uniquement).

**Rate limit (login)** — 1 essai par phase :

| Phase | `@HitLimit` (clé) | Échec |
|-------|-------------------|-------|
| Mot de passe (sans code TOTP valide) | `{ip}:login:password` — limit 1 | `401 Invalid credentials` |
| Mot de passe OK → challenge TOTP | `{ip}:login:password` consommé | `401 TOTP code required` |
| Code TOTP (6–8 chiffres) | `{ip}:login:totp` — limit 1 | `401 Invalid TOTP code` |

Deux buckets séparés (`loginRouteHitLimitKey`) : l’étape mot de passe ne bloque pas l’étape TOTP en `429`.

Fichiers principaux : `application/totp-enrollment.service.ts`, `application/totp-config.ts`, `adapters/totp/totp-secret-seal.ts`, `controllers/totp-enrollment.controller.ts`, `adapters/http/login-route-hitlimit.util.ts`.

Variables : **`TOTP_ISSUER`** (defaut `BugBountyApp`), **`TOTP_EPOCH_TOLERANCE`** pour `verify()` (defaut `30` secondes).

## Regle d'architecture

Pipeline actuel :

- Utiliser les guard/strategies Passport pour l'auth des requetes.

Toute nouvelle valeur de configuration lisible dans le module (`AUTH_TYPE`, nom du cookie refresh, etc.) doit passer par **`config/auth-env.ts`** lorsqu’elle est partagee (eviter les `process.env` epars dans tout le dossier pour la meme chose).

## Tests (Passport uniquement)

La couverture auth actuelle cible `PASSPORT_JWT` avec mocks/stubs (sans base reelle):

- `controllers/passport-jwt-auth.controller.spec.ts` (cookies + `refresh`, corps JSON sans refresh)
- `application/commands/request-password-reset.command.spec.ts` (demande reset + echec envoi mail)
- `application/queries/*.spec.ts` (delegation vers `AuthRepository` / `REFRESH_TOKEN_REPOSITORY` reste teste via mocks)
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
- Tester aussi `POST /api/auth/refresh` avec **`Cookie`** + `credentials` (Navigateur ou `curl -c/-b`).

6) **Finaliser**
- Corriger naming/structure restants (fichiers devenus trompeurs).
- Laisser une architecture explicite: un port principal (`AuthRepository`) + adapters de la strategie active.
