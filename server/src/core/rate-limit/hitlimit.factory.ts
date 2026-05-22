import type { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { isRateLimitEnabled } from '../../shared/is-rate-limit-enabled';
import type { HitLimitModuleOptions } from './hitlimit';
import { redisStore } from './hitlimit';

function clientIp(req: Request): string {
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

/** Paths that should not consume the global rate limit budget. */
function shouldSkipRateLimit(req: Request): boolean {
  if (!isRateLimitEnabled()) {
    return true;
  }
  const path = (req.path || req.url || '').split('?')[0];
  if (path.endsWith('/ping')) {
    return true;
  }
  if (path.includes('/docs')) {
    return true;
  }
  return false;
}

function resolveStore(config: ConfigService): HitLimitModuleOptions['store'] {
  const mode = (config.get<string>('RATE_LIMIT_STORE') ?? '')
    .trim()
    .toLowerCase();
  if (mode === 'memory') {
    return undefined;
  }

  const explicitUrl = config.get<string>('REDIS_URL')?.trim();
  const useRedis = mode === 'redis' || Boolean(explicitUrl);
  if (!useRedis) {
    return undefined;
  }

  const host = config.get<string>('REDIS_HOST', '127.0.0.1');
  const port = config.get<string>('REDIS_PORT', '6379');
  const password = config.get<string>('REDIS_PASSWORD')?.trim();

  const url =
    explicitUrl ||
    (password
      ? `redis://:${encodeURIComponent(password)}@${host}:${port}`
      : `redis://${host}:${port}`);

  return redisStore({
    url,
    keyPrefix: config.get<string>('RATE_LIMIT_REDIS_PREFIX', 'bb:rl:'),
  });
}

/**
 * Default hitlimit options for {@link HitLimitModule.registerAsync}.
 */
export function createHitLimitModuleOptions(
  config: ConfigService,
): HitLimitModuleOptions {
  const limit = Number(config.get<string>('RATE_LIMIT_DEFAULT', '100'));
  const window = config.get<string>('RATE_LIMIT_WINDOW', '1m');

  return {
    limit: Number.isFinite(limit) && limit > 0 ? limit : 100,
    window,
    key: (req) => clientIp(req),
    skip: (req) => shouldSkipRateLimit(req),
    headers: {
      standard: true,
      legacy: true,
      retryAfter: true,
    },
    store: resolveStore(config),
  };
}
