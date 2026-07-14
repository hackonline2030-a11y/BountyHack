# Audit technique BountyHack — rapport de reprise

> Audit de reprise. Périmètre : monorepo `client/` (Next.js 16 App Router, BFF) + `server/` (NestJS 11, Nx, Prisma) + `server/docker`. ~880 fichiers TS. Analyse en lecture seule.
> Notation sévérité : 🔴 Critique · 🟠 Important · 🟢 Sain / cosmétique. Chaque constat marqué **CONFIRMÉ** (vérifié dans le code) ou **HYPOTHÈSE** (impact déduit, à confirmer en runtime/déploiement).

## Verdict global

Base **nettement plus saine que la moyenne**. Le cœur métier est bon : hexagonal / DDD réel côté client comme serveur, typage strict côté client, RBAC et contrôle d'accès objet (IDOR) solides côté serveur. La dette est concentrée sur **3 fronts** :

1. **Sécurité de déploiement** — secret JWT faible versionné, module dev exposé, hygiène git.
2. **Duplication mécanique** — dashboards par rôle, proxy BFF.
3. **Outillage non finalisé** — CI décorative, tsconfig serveur non strict, doubles migrations.

Rien ne bloque la reprise du dev, mais 4 points 🔴 coûteront cher si non traités **avant** de monter en charge.

---

## Axe 1 — Architecture & découpage

**🔴 Cycle de dépendances `report-draft ↔ report-team`** — CONFIRMÉ. `report-draft.module.ts:6` importe `ReportTeamModule` ; en sens inverse `report-team/adapters/postgre-prisma/report-team-prisma.mapper.ts:9` importe `ReportDraftPrismaMapper`, et les types s'importent mutuellement (`report-draft-api.types.ts:6` ↔ `report-team-api.types.ts:1`). Cycle de modules + mappers + types avéré.

**🔴 `quality` consomme les internes de `report-draft`** — CONFIRMÉ. `quality/application/queries/list-quality-report-draft-targets.query.ts:3-4` importe le mapper ET la policy d'accès d'un autre contexte. Aucun port / anti-corruption entre contextes.

**🔴 Repository `users` importe la logique de 2 autres contextes** — CONFIRMÉ. `users/adapters/postgre-prisma/prisma-user-repository.ts:22-24` importe `resolveReportImageAssetPath` (report-draft), `ReportTeamEnumMapper` et `assertAtMostOneQualityChecker` (report-team).

**🔴 `PrismaService` injecté dans 5 use cases** — CONFIRMÉ, contourne les ports : `auth/application/totp-enrollment.service.ts:28`, `report-draft/application/admin/super-admin-final-validation.service.ts:67` (manipule le type de transaction brut), `.../queries/list-all-report-draft-attachments.query.ts:17`, `.../attachments/report-draft-image-asset.service.ts:49`, `report-team/application/report-team-member-role.resolver.ts:20`.

**🟠 Structure incohérente entre contextes** — CONFIRMÉ. Seuls `auth` et `document-rendering` ont un vrai `domain/` ; `report-draft`/`report-team`/`quality` n'ont qu'un `models/` de types *wire* API. `users` n'a pas de couche `application/` (commands/queries à la racine) et empile 4 dossiers de shapes (`dto`, `entities`, `models`, `payloads`). Nommage infra : `adapters/` partout sauf `document-rendering/` et `core/` en `infrastructure/`.

**🟠 God files** — CONFIRMÉ. `quality/adapters/postgre-prisma/prisma-quality.repository.ts` = **638 lignes** (5 agrégats dans une classe) ; `report-draft-access.policy.ts` = 495 ; `report-draft.module.ts` = 399 (~25 providers en `useFactory` manuels).

**🟠 `DomainException` morte** — CONFIRMÉ. `shared/exception.ts` définit une base d'exceptions domaine **jamais importée**. Deux philosophies d'erreurs coexistent : `document-rendering` = erreurs domaine mappées en bordure (propre) ; tous les autres = `HttpException` directement dans les use cases (report-draft en compte 78).

**🟢 Client exemplaire** — CONFIRMÉ. Pages = wrappers fins server-component, logique dans `modules/<bc>/core/` (usecase/gateway/repository/store Redux), 99 `"use client"` cantonnés aux modules. Screaming architecture réelle.

---

## Axe 2 — Code mort / dette / duplication

**🔴 `DashboardCard.tsx` copié ×3 à l'octet près** + **6 dashboards `welcome-*` dupliqués** (~1795 lignes cumulées + sidebars ×5-6 + `icons.tsx` ×6) — CONFIRMÉ. Entropie déjà visible : `welcome-admin/page.tsx:10` importe un composant depuis `(mentor)/welcome-mentor/_components/`.

**🔴 Fixtures mock rendues en production** — CONFIRMÉ. 4 dashboards importent `./_data/fixtures` (477 lignes de faux badges/messages) affichés à l'utilisateur : `welcome-hunter/page.tsx:24`, mentor, quality-checker, coordinator. `ReportTeamMockBanner` également actif.

**🔴 `lib/report-draft/server-draft-store.ts` : zéro importeur** — CONFIRMÉ. Store BFF in-memory mort, entraîne la chaîne `in-memory.report-draft.repository-infra.ts` (utilisée seulement par tests).

**🟠 Proxy BFF : 57 `route.ts`, ~65-70 % de squelette dupliqué** — CONFIRMÉ. Forwarding déjà factorisé (`lib/report-draft/api-auth.ts`), mais le handler ~25 lignes (guard → parse body → fetch Nest → `jsonFromNestResponse`) est recopié par route, avec **incohérence** sur JSON invalide (`primary-hunter` renvoie 400, `request-changes` CONFIRMÉ `body = {}`). Le catch-all `quality/[[...path]]/route.ts` (44 lignes pour tout le module) prouve l'alternative.

**🟠 Helpers dupliqués** — CONFIRMÉ. `http-json.ts` ×3 contextes ; 14 `fetch()` bruts contournent `fetchBff` (sans retry-401/refresh) dans les panels admin/profil.

**🟠 Adapters multi-DB partiellement morts** — CONFIRMÉ. `users`/`auth`/`ping` câblent in-memory/mongo/postgre par switch `variables.database`, mais `report-draft`/`report-team`/`quality`/`document-rendering` câblent Prisma **en dur**. Modes `MONGODB`/`IN-MEMORY` **cassés pour 4 contextes sur 6**. Mongo users = stub (`NotImplementedException`). `user-seeds.ts` mort. → **Décision actée : suppression** (voir plan #11).

**🟢 Peu de TODO** — CONFIRMÉ. 1 seul TODO assumé (`report-draft.domain-model.ts:216`), 0 TODO/FIXME dans `server/src`.

**🟠 Frontend legacy côté NestJS** — CONFIRMÉ. `main.ts:39-42` câble un moteur de vues EJS (`setViewEngine('ejs')`, `setBaseViewsDir(views)`, `useStaticAssets(static)`) et `app.controller.ts` rend `@Render('index')` (l.39) + `@Render('dashboard')` (l.68, l.97) → `server/views/{index,dashboard}.ejs` + `server/static/css/styles.css`. Reliquat des premiers tests de génération de rapports, désormais assurée par Next.js. À supprimer (vues + static + routes `@Render` + câblage EJS de `main.ts`), ce qui **ferme aussi** le `GET /dashboard` anonyme signalé en Axe 3. **Ne pas toucher** à `server/templates/report-final/` : c'est le template EJS du PDF (Puppeteer), bien vivant.

---

## Axe 3 — Sécurité

**🔴 `JWT_SECRET` faible, versionné, probablement réutilisé en prod** — CONFIRMÉ + HYPOTHÈSE forte. `server/.env.example:71` et `client/.env.example:19` : `JWT_SECRET=mon-lapin-caillousky-dans-la-serre` (phrase devinable), aussi dans les README. `vps.md:147` suggère la même valeur en prod. Secret HS256 symétrique partagé Nest↔Next → **forge de jetons pour n'importe quel compte/rôle, y compris SUPER_ADMIN**. Point le plus critique de tout l'audit.

**🔴/🟠 Module `report-draft/dev` non authentifié** — CONFIRMÉ. Contrôleur entier lisant n'importe quel draft/submission par id, protégé **uniquement** par `DevOnlyGuard` qui ne 404 que si `NODE_ENV === 'production'` exactement (`shared/dev-routes.util.ts`). Tout staging/preview avec un `NODE_ENV` différent **expose toutes les données report-draft**. À exclure au build, pas au runtime.

**🟠 Modèle fail-open** — CONFIRMÉ. Aucun guard d'auth global (`APP_GUARD` = seulement rate-limit). Toute route publique sauf opt-in `@Auth()`/`@AuthRoles()`. Sûr aujourd'hui (vérifié handler par handler), mais un futur endpoint oublié sera anonyme par défaut. `GET /dashboard` et `/dashboard/:draftId` anonymes exposent les drafts *published* (CVSS, composition d'équipe).

**🟠 Durcissements manquants** — CONFIRMÉ. Pas de **helmet** (aucun header CSP/HSTS/X-Frame). `ValidationPipe` global en `forbidNonWhitelisted:false` (props inconnues supprimées silencieusement au lieu de 400). Cookie `secure` conditionné à `NODE_ENV==='production'` (préprod HTTPS non-prod → cookie en clair possible).

**🟠 Aucune protection CSRF explicite** — CONFIRMÉ. Zéro `csrf`/`xsrf`/`csurf` dans le code ; la défense repose **entièrement** sur `sameSite: 'lax'` + cookies `httpOnly` (`auth/adapters/http/jwt-refresh-cookie.ts:22`, `modules/auth/core/gateway-infra/next-cookies-app-host-session.gateway-infra.ts:23`). SameSite=Lax bloque bien l'envoi du cookie sur une mutation POST/PATCH/DELETE cross-site → protection de base réelle, donc pas 🔴. Mais aucun jeton CSRF en défense en profondeur (mutations same-origin via BFF, contexte multi-sous-domaines `hackthebounty.fr` / `api.hackthebounty.fr`). *Note : à ne pas confondre avec le XSS, déjà mitigé — token en cookie httpOnly non lisible par JS + échappement React.* → stratégie à trancher (voir backlog).

**🟠 Hygiène secrets** — CONFIRMÉ. `jwt_exple_mongo` (racine) = mot de passe en clair + 2 vrais JWT. Dumps SQL trackés (`server/dump/*.sql` 196 Ko, `server/docker/dump/*`) — données de démo synthétiques (scrypt, tokens SHA-256, pas de PII réelle vérifiée) mais ne devraient pas être suivis. Docker dev : creds `bugbountyapp/bugbountyapp`, Mongo sans auth + mongo-express `BASICAUTH:false`, Redis sans mot de passe.

**🟢 Points sains confirmés** — CONFIRMÉ, à ne pas casser :
- **Aucun IDOR trouvé** : policies d'accès objet centralisées et systématiques (`report-draft-access.policy.ts:233` `assertCanReadDraft`, appelée à chaque query/command) ; owner re-dérivé côté serveur (`save-report-draft.command.ts:31-33` = anti mass-assignment) ; `attachmentId` lié au `draftId` (`report-draft-image-asset.service.ts:169`).
- Refresh token opaque haché SHA-256 avec **rotation** + révocation (logout/reset).
- Mots de passe scrypt + `timingSafeEqual`, login à message générique (pas d'énumération).
- TOTP chiffré AES-256-GCM au repos, disable exige un code courant.
- Reset password admin-only, transactionnel, révoque les refresh tokens.
- Tokens en cookies **httpOnly** (zéro Web Storage). BFF : proxy quality authentifié + namespacé, allow-list de rôles au login.
- **Aucune requête Prisma raw**. Template PDF échappé + images `data:` restreintes (pas de XSS/SSTI/SSRF). CORS à origines explicites, rate-limit par route.

---

## Axe 4 — Bonnes pratiques à corriger tôt

**🔴 CI décorative** — CONFIRMÉ. `.github/workflows/{client,server}-ci.yml` ne se déclenchent que sur `feature/test-ci`. `main` et `develop` ne lancent **rien**. Gitleaks présent mais `continue-on-error: true`. Aucun husky/pre-commit.

**🔴 `server/tsconfig.json` non strict** — CONFIRMÉ. Ni `strict`, ni `strictNullChecks`, ni `noImplicitAny`. Toute la couche Nest compilée sans null-safety. `tsconfig.app.json:6-11` déclare des types `@angular/*` (backend Nest — boilerplate copié-collé).

**🔴 Fichiers générés/binaires commités** — CONFIRMÉ. `server/src/generated/prisma/**` (37 fichiers) tracké ; `client/dev.db` (SQLite) ; dumps SQL. `.gitignore` incomplet (règle `src/generated/prisma/` commentée volontairement).

**🔴 Doubles migrations Prisma divergentes** — CONFIRMÉ. `prisma/migrations/` (23, postgres) vs `prisma/migrations-mysql/` (12, mysql), tails différents. Deux schémas maintenus à la main déjà légèrement divergents. Trois défauts contradictoires (`prisma.config.ts`=postgres, `.env.example`=mysql, `variables.config.ts`=in-memory). → **Décision actée : MySQL seul en prod, suppression de Postgres** (voir plan #10).

**🔴 `package.json` racine coquille morte + `pnpm-workspace.yaml` placeholder** — CONFIRMÉ. Racine = 2 deps orphelines, pas de workspaces ; `server/pnpm-workspace.yaml` contient littéralement `set this to true or false`.

**🟠 Divers** — CONFIRMÉ. Versions pnpm incohérentes (11.7 / 10.32 / 9.9). `console.log` en prod (`mongo-user-repository.ts:25`, `lib/dal/welcome-user.ts:31`). i18n : ~20 composants report-draft avec **texte FR en dur** → anglais cassé sur le workflow. Nommage `useCase/` vs `usecase/` (58 vs 15 fichiers). Pas de package DTO partagé client/serveur. 0 test contexte `quality` (serveur), 0 test composant React.

---

## Décisions actées

- **Cible DB : MySQL seul en prod.** Postgres à supprimer (schéma, migrations, dumps), pas à maintenir.
- **Adapters mongo / in-memory : à supprimer.** Postgres/MySQL est la seule cible réelle ; le switch multi-DB est retiré.

---

## Plan d'action — 2-3 jours, 2 devs

Principe : **jour 1 = sécurité + hygiène** (faible effort, fort impact, protège le reste), **jours 2-3 = duplication mécanique + nettoyages actés** (fort volume, faible risque, parallélisable). Les gros chantiers structurels sont **hors fenêtre**.

Notation : **P** = à faire en pair (risqué), **∥** = parallélisable, charge en demi-journées (dj).

### Dans la fenêtre

| # | Tâche | Fichiers / zones | Charge | Risque | Mode |
|---|---|---|---|---|---|
| 1 | Rotation `JWT_SECRET` + `TOTP_ENCRYPTION_KEY`, placeholders dans `.env.example`/README, regénérer le secret **prod** | `server/.env.example:71`, `client/.env.example:19`, READMEs, `vps.md` | 0,5 | Élevé (casse sessions prod) | **P** |
| 2 | Détracker `src/generated/prisma/`, `client/dev.db`, dumps `*.sql`, supprimer `jwt_exple_mongo` ; compléter `.gitignore` ; purge historique | `.gitignore`, git | 0,5 | Moyen (réécriture historique) | **P** |
| 3 | Exclure `report-draft/dev` **au build** (pas via `NODE_ENV` runtime) | `report-draft/dev/*`, module core | 0,25 | Faible | ∥ |
| 4 | helmet + `ValidationPipe forbidNonWhitelisted:true` + cookie `secure` hors localhost | `main.ts`, `jwt-refresh-cookie.ts` | 0,5 | Faible-moyen | ∥ |
| 5 | CI sur `main`/`develop`, retirer `continue-on-error` de Gitleaks | `.github/workflows/*` | 0,25 | Faible | ∥ |
| 6 | Factoriser `welcome-*` : 1 layout + config par rôle, dédup `DashboardCard`/`icons`/sidebar | `client/app/[lng]/(*)/welcome-*` | 1,5 | Faible | ∥ |
| 7 | Factoriser le proxy BFF : forwarder générique (guard, préfixe, méthode) + JSON-invalide unifié | `client/app/api/**` (57 routes) | 1,5 | Moyen (57 routes à re-tester) | ∥ |
| 8 | Supprimer code mort : `server-draft-store.ts` + chaîne in-memory client, `DomainException`, `user-seeds.ts`, `README.nx.md`, fixtures mock des dashboards, **+ frontend EJS legacy serveur** (`server/views/`, `server/static/`, routes `@Render` de `app.controller.ts`, câblage EJS de `main.ts`) — garder `templates/report-final/` | multi | 0,75 | Faible | ∥ |
| 9 | `server/tsconfig.json` → `strictNullChecks` + purge types Angular | `server/tsconfig*.json` + corrections | 1 (timeboxé) | **Élevé** (erreurs révélées) | **P** |
| 10 | **Supprimer la cible Postgres** : `schema.prisma`, `migrations/`, dumps `users_postgres`, aligner `prisma.config.ts` défaut sur MySQL, `.env.example`. Vérifier d'abord qu'aucun env (CI, dev collègue) n'en dépend | `prisma/*` | 0,5 | Faible (après vérif) | ∥ |
| 11 | **Supprimer adapters `mongo`/`in-memory`** (auth/users/ping), retirer switch `variables.database` + `DATABASE_MODES`, câbler Prisma en dur. Migrer les tests s'appuyant sur l'in-memory vers un mock | `auth`, `users`, `ping`, `shared/variables.config.ts` | 0,75 | Faible-moyen (tests à réparer) | ∥ (après #9) |

Total ≈ 7,5 dj → jouable sur 3 jours à deux. Si #9 déborde → **le renvoyer au backlog** ; #10/#11 ont un meilleur ratio impact/risque maintenant que les décisions sont prises.

### Reporté (backlog dette — chantiers de design à froid)

- Casser le cycle `report-draft ↔ report-team` + ACL `quality → report-draft` (port / anti-corruption).
- Sortir `PrismaService` des 5 use cases (repasser par les ports).
- i18n report-draft (~20 composants FR en dur).
- Tests `quality` (0 → couverture) + split `prisma-quality.repository.ts` (638 l.).
- Package DTO partagé client/serveur ; tests composants React ; unification `useCase`/`usecase` et `adapters`/`infrastructure` ; renommage `postgre-prisma/` → `prisma/`.
- **Revue de modélisation DDD (screaming architecture + langage ubiquitaire).** Angle remonté par l'équipe, réel : `users` est un nom fourre-tout sans sens métier (risque de module poubelle) ; `users/payloads/` est un terme technique, pas métier ; l'organisation `domain/` vs `models/` vs `entities/` vs `dto/` vs `payloads/` doit être arbitrée et rendue cohérente entre contextes. Chantier de **modélisation** (pas un renommage mécanique) : identifier les vrais bounded contexts et leur vocabulaire, décider quels contextes méritent un `domain/` riche vs un CRUD simple. À faire à froid, en équipe. *Cadré dans `.agent/architecture` — s'y référer.*
- **Stratégie CSRF.** Décider entre (a) rester sur `SameSite=Lax` seul (acceptable vu httpOnly + mutations JSON same-origin), (b) passer les cookies de session en `SameSite=Strict` là où c'est possible, ou (c) ajouter un jeton CSRF double-submit sur les mutations du BFF. Trancher selon le modèle de menace réel (sous-domaines, tiers).

### Étudié et *non recommandé* à ce stade

- **Migration Prisma → Drizzle (ou autre ORM).** Question posée par l'équipe. Avis : **non**, pas dans un horizon proche. La douleur qui motivait la question — le double schéma Postgres/MySQL — disparaît avec la tâche #10 (MySQL seul). Une migration d'ORM réécrit **toute** la couche repository (tous les contextes), casse les migrations existantes et le client généré, pour un bénéfice de « malléabilité » marginal une fois la cible DB unique. Risque élevé, ROI faible. À reconsidérer seulement si un besoin concret bloque (perf, type-safety des requêtes brutes, edge runtime) — pas par principe.

### Répartition

Le découpage se fait par **couplage de fichiers**, pas par jour : certaines tâches touchent les mêmes fichiers et doivent rester groupées (même dev / même PR). L'axe de séparation entre les deux devs est **serveur vs client** — ainsi personne ne touche les fichiers de l'autre, sauf le bloc secrets/git fait ensemble.

#### Blocs indissociables (couplés par fichiers partagés)

- **Bloc SECRETS/GIT = #1 + #2.** Rotation du secret et purge de l'historique = une seule opération coordonnée (régénérer le secret ET effacer l'ancien de l'historique en une passe). Irréversibles, touchent la prod. → **en pair, en premier.**
- **Bloc EDGE SERVEUR = #3 + #4 + la partie EJS de #8.** Les trois éditent les mêmes fichiers : `main.ts` (helmet/cookies + câblage EJS), `app.controller.ts` / `app.module.ts` (module dev + routes `@Render`). → **un seul dev.**
- **Bloc DATA-LAYER = #10 + #11.** Suppression Postgres + adapters morts partagent le câblage des modules et `variables.config.ts`. #11 touche `app.module` → **même dev que le bloc EDGE.**
- **Bloc DASHBOARDS = #6 + la partie fixtures de #8.** Les fixtures mock vivent dans les dashboards `welcome-*` → **même personne.**

#### Barrière : #9 (tsconfig strict)

Seule tâche qui traverse **tout** le serveur (`strictNullChecks` fait remonter des erreurs partout, y compris dans ce que #3/#4/#10/#11 modifient). À traiter comme une barrière, pas en parallèle : **spike de mesure tôt** (~30 min : activer le flag, compter les erreurs), puis décider — peu d'erreurs → la poser en premier (tout est écrit strict d'emblée) ; beaucoup → **backlog**, les autres blocs avancent en non-strict.

#### Vraiment indépendants

- **#7 (forwarder BFF)** — uniquement `app/api/**`, aucun recouvrement avec #6. Parallélisable librement.
- **#5 (CI)** — uniquement `.github/`. Aucun couplage, quick win jour 1.

#### Les deux lanes

| | **Dev A — lane SERVEUR** | **Dev B — lane CLIENT** |
|---|---|---|
| Ensemble | Bloc SECRETS/GIT (#1 + #2) en pair | Bloc SECRETS/GIT (#1 + #2) en pair |
| Puis | Bloc EDGE (#3 + #4 + #8-EJS) → Bloc DATA-LAYER (#10 + #11) | Bloc DASHBOARDS (#6 + #8-fixtures) → #7 (forwarder BFF) |
| Barrière | #9 strict : spike tôt, puis pose selon le compte d'erreurs | dispo pour pairer sur #9 si ça explose |
| Bouche-trou | #5 (CI) — jour 1 | — |

Les deux devs ne partagent jamais un fichier, hors bloc secrets/git fait à deux. Seul point à cadencer ensemble : #9 comme barrière, décidée après le spike.

**Méthode** : une PR par tâche (la CI de #5 devient utile dès le jour 1) plutôt qu'une grosse PR de refacto — plus sûr à deux, et ça valide que la CI mord.

---

## Recommandations d'amélioration

### BFF — recommandation centrale : passer du copier-coller au déclaratif

57 `route.ts`, ~1900 lignes, même squelette recopié (guard → parse body → fetch Nest → renvoie). L'alternative existe déjà dans le repo (`quality/[[...path]]`). Deux niveaux :

**Option A — forwarder générique, un fichier par route conservé.** Chaque route se réduit à de la config :

```ts
// lib/bff/forward.ts
export async function forward(req: NextRequest, cfg: {
  guard: () => Promise<{ token: string } | { response: Response }>,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  nestPath: (params) => string,
  body?: "json" | "none",
}) { /* garde, parse, fetch Nest, jsonFromNestResponse — un seul endroit */ }

// route.ts devient :
export const PATCH = (req, { params }) => forward(req, {
  guard: requireCoordinatorBearer,
  method: "PATCH",
  nestPath: ({ draftId }) => `report-draft/drafts/${draftId}/primary-hunter`,
  body: "json",
});
```

**Option B — un seul catch-all `/api/[[...path]]` + table de politiques.** `quality/[[...path]]` généralisé à tout : une route unique + une table déclarant, par préfixe, le garde/rôle requis. ~57 fichiers → 1 route + 1 config (~1900 lignes → ~150).

**Recommandation : Option A d'abord** — moins de magie, chaque route reste greppable, migration incrémentale sans big-bang. Option B seulement si l'équipe assume une table de routing centralisée (plus élégant, moins explicite au débogage).

### Ce que la factorisation force à trancher (à corriger dans la même passe)

1. **Comportement JSON invalide unifié** — aujourd'hui `primary-hunter` = 400, `request-changes` = `body = {}`. Centraliser impose **une** règle (400 recommandé) appliquée partout.
2. **Registre garde ↔ rôle** — remplacer les N helpers `requireXBearer` par un `requireBearer(roles: Role[])` unique.
3. **Tout router par `fetchBff`** — les 14 `fetch()` bruts contournent le retry-401/refresh → déconnexions intempestives. Un seul chemin de sortie réseau côté client.

### BFF — sécurité (même passe)

4. **Rejeter `..` dans `quality/[[...path]]`** — `path.join("/")` sans filtrage pourrait sortir du préfixe `quality/`. Nest garde chaque endpoint (pas de faille prouvée), mais `if (segments.includes("..")) return 400` dans le forwarder l'applique à toutes les routes d'un coup.
5. **Enveloppe d'erreur normalisée** — centraliser le mapping des 500 upstream vers `{ error, requestId }` au lieu de renvoyer le corps d'erreur Nest brut.

### Au-delà du BFF (même principe)

6. **Contrat typé client↔serveur** — trou le plus coûteux à terme : types API réécrits à la main côté client, aucune validation runtime. Un petit package `contracts` (schémas zod partagés → types inférés des deux côtés) rend le forwarding typé de bout en bout et casse à la compilation quand une shape serveur change. Complément naturel du forwarder : `forward()` valide le body avec le schéma zod du endpoint. (Rejoint le point backlog « package DTO partagé ».)
7. **Dashboards `welcome-*`** — même remède : un `<DashboardLayout>` + config par rôle au lieu de 6 copies (= tâche #6).

### Principe transverse

Les 3 duplications (BFF, dashboards, helpers `http-json`) sont le **même symptôme** : le projet factorise bien la *logique* (helpers d'auth propres) mais pas la *structure* (le squelette autour). Règle à faire passer dans l'équipe : **quand le même squelette apparaît 3 fois, il devient une fonction qui prend la variation en paramètre.**
