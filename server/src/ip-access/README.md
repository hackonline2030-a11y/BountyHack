# IP access (`src/ip-access`)

Politique réseau transversale : **blacklist** après échec de login, **whitelist** optionnelle (super-admin, Prisma SQL).

Aligné sur `report-team` / `quality` : `application/commands|queries`, `ports/*-repository.interface.ts`, `adapters/prisma-sql/` (PostgreSQL + MySQL via Prisma, voir `isPrismaSqlMode()`).

## Comportement

### Blacklist (login)

1. `POST /api/auth/login` échoue avec un **échec réel** (`401`, hors challenge TOTP) → `LoginAuthFailureFilter` appelle `BlacklistClientIpCommand`.
2. L’IP est stockée via `I_IP_BLACKLIST_STORE` (Redis si `REDIS_URL`, sinon mémoire process) — **non persistée en BDD** (anti-DDoS sur volume de clés).
3. `IpAccessGuard` bloque les requêtes suivantes (`403`) sauf si l’IP correspond à une entrée **réautorisée** (`ip_reallow_entries`).

**Réautorisation (persistée)** : table `ip_reallow_entries` — bypass blacklist **indépendant** du mode whitelist-only.

- **Pas de mutation HTTP** : `GET /api/ip-access/admin/reallow` (audit super-admin) uniquement. Aucun `POST`/`DELETE` — un session hijack ne peut pas réautoriser via l’API.
- **Ajout hors app** : après vérification **orale** (téléphone), insérer en base (Adminer / psql). CIDR **canonique** (`203.0.113.10/32`).

Exemple PostgreSQL :

```sql
INSERT INTO ip_reallow_entries (id, cidr, label, created_by_user_id)
VALUES (gen_random_uuid()::text, '203.0.113.10/32', 'Hunter — appel 2026-06-24', '<super_admin_user_id>');
```

Exemple MySQL :

```sql
INSERT INTO ip_reallow_entries (id, cidr, label, created_by_user_id)
VALUES (UUID(), '203.0.113.10/32', 'Hunter — appel 2026-06-24', '<super_admin_user_id>');
```

Le cache reallow se rafraîchit sous `IP_ACCESS_WHITELIST_CACHE_TTL_SEC` (partagé avec whitelist snapshot).

**TOTP (2-step)** : `401 TOTP code required` **ne blackliste pas**.

Désactivé en `development` / `test` sauf `IP_ACCESS_FORCE=1` (voir `shared/is-ip-access-enabled.ts`).

### Whitelist (optionnel, Prisma SQL)

- Tables `ip_access_settings` (singleton) + `ip_whitelist_entries` (CIDR **canoniques**).
- Admin : `GET /api/ip-access/admin/blacklist`, `GET /api/ip-access/admin/reallow` (lecture seule), `GET|POST|DELETE /api/ip-access/admin/whitelist`, `PUT /api/ip-access/admin/whitelist/enabled` — **SUPER_ADMIN** via `@AuthRoles`.
- UI client : `/{lng}/administration/ip-access` (super-admin).
- Quand `ipWhitelistEnabled = true`, seules les IP dans la whitelist atteignent l’API (hors `/ping`, `/docs`).
- Snapshot whitelist en cache mémoire (`IpWhitelistSnapshotCache`, TTL configurable) ; invalidé à chaque mutation admin.

### CIDR (CA-CIDR)

- Normalisation obligatoire dans `AddIpWhitelistEntryCommand` via `application/utils/cidr-normalize.util.ts`.
- Ex. `203.0.113.10` → `203.0.113.10/32` avant insert ; doublon sémantique → `409 Conflict`.

### Frontière bounded context

- Application `ip-access` utilise `IpAccessActor` (`userId` seulement), mappé depuis `Identity` au controller (`map-ip-access-actor.ts`).
- `IpAccessModule` ne dépend pas de `AuthModule` (pas de cycle `forwardRef`).

## Ports

| Token | Rôle |
|-------|------|
| `I_IP_BLACKLIST_STORE` | blacklist éphémère / Redis |
| `I_IP_WHITELIST_REPOSITORY` | settings + entrées persistées |

## Configuration (`.env`)

```env
IP_ACCESS_FORCE=1
IP_ACCESS_DISABLED=1
IP_ACCESS_STORE=memory|redis
IP_ACCESS_REDIS_PREFIX=bb:sec:bl:
IP_ACCESS_BLACKLIST_TTL_SECONDS=0
IP_ACCESS_WHITELIST_CACHE_TTL_SEC=30
RATE_LIMIT_TRUST_PROXY=1
RATE_LIMIT_LOGIN=1
RATE_LIMIT_LOGIN_WINDOW=24h
```

Login : `@HitLimit(1)` avec clés `{ip}:login:password` et `{ip}:login:totp` (voir `loginRouteHitLimitKey`). La blacklist IP complète la politique sur les vrais échecs.

## Fichiers liés auth

- `auth/adapters/http/login-auth-failure.filter.ts` — hook login uniquement ; ignore `LoginTotpChallengeRequiredError`.
- `shared/http/client-ip.util.ts` — IP client partagée avec `core/rate-limit`.
- `shared/http/public-api-path.util.ts` — exclusions `/ping`, `/docs` (rate-limit + ip-access).

## Tests

```sh
pnpm exec nx run web-api:test --testPathPattern=ip-access
```
