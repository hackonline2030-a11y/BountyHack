# IP access (`src/ip-access`)

Politique réseau transversale : **whitelist IP optionnelle** (super-admin, Prisma SQL).

Aligné sur `report-team` / `quality` : `application/commands|queries`, `ports/*-repository.interface.ts`, `adapters/prisma-sql/` (PostgreSQL + MySQL via Prisma, voir `isPrismaSqlMode()`).

## Comportement

### Whitelist (optionnel, Prisma SQL)

- Tables `ip_access_settings` (singleton) + `ip_whitelist_entries` (CIDR **canoniques**).
- Admin : `GET|POST|DELETE /api/ip-access/admin/whitelist`, `PUT /api/ip-access/admin/whitelist/enabled` — **SUPER_ADMIN** via `@AuthRoles`.
- UI client : `/{lng}/administration/ip-access` (super-admin).
- Quand `ipWhitelistEnabled = true`, seules les IP dans la whitelist atteignent l’API (hors `/ping`, `/docs`).
- Snapshot whitelist en cache mémoire (`IpWhitelistSnapshotCache`, TTL configurable) ; invalidé à chaque mutation admin.

Désactivé en `development` / `test` sauf `IP_ACCESS_FORCE=1` (voir `shared/is-ip-access-enabled.ts`).

### CIDR (CA-CIDR)

- Normalisation obligatoire dans `AddIpWhitelistEntryCommand` via `application/utils/cidr-normalize.util.ts`.
- Ex. `203.0.113.10` → `203.0.113.10/32` avant insert ; doublon sémantique → `409 Conflict`.

### Frontière bounded context

- Application `ip-access` utilise `IpAccessActor` (`userId` seulement), mappé depuis `Identity` au controller (`map-ip-access-actor.ts`).
- `IpAccessModule` ne dépend pas de `AuthModule`.

## Ports

| Token | Rôle |
|-------|------|
| `I_IP_WHITELIST_REPOSITORY` | settings + entrées persistées |

## Configuration (`.env`)

```env
IP_ACCESS_FORCE=1
IP_ACCESS_DISABLED=1
IP_ACCESS_WHITELIST_CACHE_TTL_SEC=30
RATE_LIMIT_TRUST_PROXY=1
```

Login : `@HitLimit(1)` avec clés `{ip}:login:password` et `{ip}:login:totp` (voir `loginRouteHitLimitKey`).

## Fichiers liés

- `shared/http/client-ip.util.ts` — IP client partagée avec `core/rate-limit`.
- `shared/http/public-api-path.util.ts` — exclusions `/ping`, `/docs` (rate-limit + ip-access).

## Tests

```sh
pnpm exec nx run web-api:test --testPathPattern=ip-access
```
