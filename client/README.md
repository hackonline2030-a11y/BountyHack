## Frontend Next.js (Bug Bounty)

Application Next.js App Router orientée UI : les formulaires d’authentification appellent l’API **Nest** (`NEXT_PUBLIC_AUTH_API`).

## Démarrage

### Installation

**Node.js** : **≥ 24** (même contrainte que l’API Nest, voir `engines` dans `client/package.json` et `server/package.json`).

Créez **`client/.env`** à partir du template (depuis la **racine du monorepo**) :

```bash
# à la racine du dépôt (si ce n'est pas déjà fait)
cp bugbountyapp/client/.env.example bugbountyapp/client/.env
```

Équivalent si vous êtes déjà dans **`client/`** :

```bash
cp .env.example .env
```

Adaptez **`client/.env`** selon vos besoins (voir **Variables d’environnement** ci-dessous et `client/.env.example`).

### Lancer le projet

Ce workspace utilise **[pnpm](https://pnpm.io)** (`packageManager` est verrouillé dans `package.json`). Activez Corepack une fois, puis installez et lancez :

```bash
corepack enable
pnpm install
pnpm dev
```

Ouvrez [http://localhost:3001](http://localhost:3001). Next dev tourne sur **3001** (`next dev -p 3001`) afin de laisser l’API Nest sur **3000** par défaut. Pour un autre port : `pnpm dev -- --port 3010` (et alignez **`CORS_ORIGIN`** dans **`server/.env`**).

**API (CORS)** : l’origine navigateur (`http://localhost:3001` en dev) doit être autorisée côté Nest — voir **`server/.env.example`** et **`server/src/shared/cors.util.ts`**.

## Contenu inclus

- Module d’auth (`modules/auth/core/`) : ports (`gateway/`), adaptateurs Next + **jose** (`gateway-infra/`, voir `JoseJwtHs256AccessTokenVerifier`), use cases, et wiring dans **`auth.factory.ts`** ; `app/api` et `lib/dal` restent des adaptateurs fins.
- Auth : **`/{lng}/login`** (public) ; **`/{lng}/administration/register`** (**`verifySessionForRoles(lng, [AppRoleCode.SUPER_ADMIN])`** dans [`lib/dal/session.ts`](lib/dal/session.ts) ; autres rôles → **`welcome-dashboard`**). L’inscription utilise **`POST /api/account/register-user`** pour que Next attache le Bearer admin (Nest rejette `POST …/auth/register` sans JWT **`SUPER_ADMIN`**). **`POST …/auth/login`** continue d’appeler Nest directement. Après login, **`POST /api/session`** enregistre le cookie **`httpOnly`** pour les vérifications DAL/BFF.
- UX login en 2 étapes si nécessaire : étape 1 (email+mot de passe), puis étape 2 (code TOTP) seulement si le backend répond `TOTP code required`. Si le TOTP n’est pas activé pour le compte, l’étape 1 crée directement la session.
- **Paramètres** `/{lng}/parameters` : TOTP géré par switch (on/off). L’UI appelle les routes BFF Next **`POST /api/account/totp/enable/start`**, **`…/enable/confirm`**, et **`…/disable`**. Ces routes proxifient vers Nest **`auth/totp/enable/*`** et **`auth/totp/disable`** avec la même session httpOnly (voir `routes.md`).
- Architecture front TOTP : `TotpEnrollmentPanel` dépend de use cases auth core (`start/confirm/disable TotpEnrollmentUseCase`) et d’un contrat gateway (`ITotpManagementGateway`) câblé dans `totp-management.factory.ts` (compatible client ; pas de `next/headers`). Le wiring session/JWT reste dans `auth.factory.ts` (server-only).
- Le header utilise **`GET /api/session/status`** pour afficher les métadonnées de session en temps réel côté client : username et rôle après le nom de l’app, `Mes paramètres` quand authentifié, et lien `Admin` seulement pour `SUPER_ADMIN`. Déconnexion : use case navigateur **`performBrowserLogoutUseCase`** (`browser-logout.factory` → `logoutFromBrowser`) puis côté Next route **`destroyAppSessionUseCase`** sur **`DELETE /api/session`** (`auth.factory` → `createDestroyAppSessionDependencies`).
- Fondation UI partagée (sections, boutons, theming)

## Variables d’environnement

Prérequis : **`client/.env`** — voir **[Installation](#installation)**.

- **`NEXT_PUBLIC_SITE_URL`** : URL publique de cette app Next (SEO, liens absolus).
- **`NEXT_PUBLIC_AUTH_API`** : origine Nest (sans slash final), ex. `http://localhost:3000`.
- **`NEXT_PUBLIC_AUTH_API_PREFIX`** (optionnel) : segment API global avant `/auth` (par défaut `api` → `http://…/api/auth/login`).
- **`JWT_SECRET`** : doit correspondre au `JWT_SECRET` Nest ; utilisé pour vérifier le JWT d’accès lors de la pose du cookie session httpOnly (`POST /api/session`) et dans le DAL pour les Server Components protégés.


## Scripts

- `pnpm dev`
- `pnpm build`
- `pnpm lint`
- `pnpm test`

## CI (GitHub Actions)

Le workflow du client vit à la racine du monorepo : **[`../.github/workflows/client-ci.yml`](../.github/workflows/client-ci.yml)** — exécution automatique sur **push / PR** de la branche **`feature/test-ci`** uniquement (chemins `client/**`), plus **`workflow_dispatch`** (E2E Playwright via l’option `run_e2e`). Contenu : lint, tests unitaires, build ; Trivy FS/config ; Gitleaks ; SonarCloud optionnel (`CLIENT_SONARCLOUD_ENABLED` + `sonar-project.properties`).




