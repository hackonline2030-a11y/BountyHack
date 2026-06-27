# IP access (`src/ip-access`)

Politique réseau transversale : **blacklist** après échec de login, **whitelist** optionnelle (super-admin, Prisma SQL).

Aligné sur `report-team` / `quality` : `application/commands|queries`, `ports/*-repository.interface.ts`, `adapters/prisma-sql/` (PostgreSQL + MySQL via Prisma, voir `isPrismaSqlMode()`).

## Comportement

### Blacklist (login)

1. `POST /api/auth/login` échoue (`401`) → `LoginAuthFailureFilter` (auth) appelle `BlacklistClientIpCommand`.
2. L’IP est stockée via `I_IP_BLACKLIST_STORE` (Redis si `REDIS_URL`, sinon mémoire process).
3. `IpAccessGuard` (`APP_GUARD`, avant `HitLimitGuard`) bloque les requêtes suivantes (`403`).

Désactivé en `development` / `test` sauf `IP_ACCESS_FORCE=1` (voir `shared/is-ip-access-enabled.ts`).

### Whitelist (optionnel, Prisma SQL)

- Tables `ip_access_settings` (singleton) + `ip_whitelist_entries` (CIDR **canoniques**).
- Admin : `GET|POST|DELETE /api/ip-access/admin/whitelist`, `PUT /api/ip-access/admin/whitelist/enabled` — **SUPER_ADMIN** via `@AuthRoles` (RBAC HTTP uniquement).
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

## Fichiers liés auth

- `auth/adapters/http/login-auth-failure.filter.ts` — hook login uniquement.
- `shared/http/client-ip.util.ts` — IP client partagée avec `core/rate-limit`.
- `shared/http/public-api-path.util.ts` — exclusions `/ping`, `/docs` (rate-limit + ip-access).

## Tests

```sh
pnpm exec nx run web-api:test --testPathPattern=ip-access
```
