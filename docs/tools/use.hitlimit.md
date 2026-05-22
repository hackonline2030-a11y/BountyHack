# Rate limiting Nest — `@joint-ops/hitlimit`

## Build

`pnpm run build` in `server/` runs `prisma generate` first. Warnings about hitlimit source maps are harmless (ignored in `webpack.config.js`). If TypeScript complains that `targetRefScope` is unknown, run `DATABASE_NAME=MYSQL_PRISMA pnpm exec prisma generate` then rebuild.

## Activation

Limitation **désactivée** automatiquement si `NODE_ENV` vaut `development` ou `test` (`server/src/shared/is-rate-limit-enabled.ts` : toutes les routes sont ignorées via `skip` dans `hitlimit.factory.ts`).

En **production** (`NODE_ENV=production`), le guard global et les `@HitLimit` par route s’appliquent.

| Variable | Effet |
|----------|--------|
| `RATE_LIMIT_FORCE=1` | Force la limitation en local (dev). |
| `RATE_LIMIT_DISABLED=1` | Désactive explicitement (même en production). |
| `RATE_LIMIT_TRUST_PROXY=1` | `req.ip` derrière nginx (`main.ts`). |

## Fichiers

| Fichier | Rôle |
|---------|------|
| `server/src/core/rate-limit/hitlimit.ts` | Barrel ESM pour Webpack/Nx |
| `server/src/core/rate-limit/hitlimit.factory.ts` | Options globales + `skip` |
| `server/src/core/rate-limit/rate-limit.limits.ts` | Plafonds login, refresh, password-reset, verify-password |
| `server/src/core/app.module.ts` | `HitLimitModule` + `HitLimitGuard` global |

## Dépendance Redis

Le store Redis de hitlimit utilise **`ioredis`** (peer dependency). Elle est installée explicitement côté serveur :

```bash
cd server && pnpm add ioredis
```

Sans `ioredis`, un compteur Redis (`REDIS_URL` ou `RATE_LIMIT_STORE=redis`) échouera au démarrage ou à la première requête limitée.

## Variables `.env` (production)

```env
RATE_LIMIT_DEFAULT=100
RATE_LIMIT_WINDOW=1m
RATE_LIMIT_LOGIN=5
RATE_LIMIT_LOGIN_WINDOW=15m
REDIS_URL=redis://127.0.0.1:6379
```
