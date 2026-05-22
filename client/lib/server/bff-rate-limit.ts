import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { NextRequest } from "next/server";
import { isBffRateLimitEnabled } from "@/lib/server/is-rate-limit-enabled";

function positiveInt(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function windowFromEnv(key: string, fallback: string): string {
  const value = process.env[key]?.trim();
  return value && value.length > 0 ? value : fallback;
}

export type BffRateLimitPolicy =
  | "default"
  | "session-establish"
  | "profile-verify-password"
  | "account-verify-password"
  | "register-user";

const POLICY_CONFIG: Record<
  BffRateLimitPolicy,
  { limitEnv: string; windowEnv: string; defaultLimit: number; defaultWindow: string }
> = {
  default: {
    limitEnv: "BFF_RATE_LIMIT_DEFAULT",
    windowEnv: "BFF_RATE_LIMIT_WINDOW",
    defaultLimit: 100,
    defaultWindow: "1m",
  },
  "session-establish": {
    limitEnv: "BFF_RATE_LIMIT_SESSION",
    windowEnv: "BFF_RATE_LIMIT_SESSION_WINDOW",
    defaultLimit: 30,
    defaultWindow: "15m",
  },
  "profile-verify-password": {
    limitEnv: "BFF_RATE_LIMIT_PROFILE_VERIFY",
    windowEnv: "BFF_RATE_LIMIT_PROFILE_VERIFY_WINDOW",
    defaultLimit: 10,
    defaultWindow: "15m",
  },
  "account-verify-password": {
    limitEnv: "BFF_RATE_LIMIT_ACCOUNT_VERIFY",
    windowEnv: "BFF_RATE_LIMIT_ACCOUNT_VERIFY_WINDOW",
    defaultLimit: 5,
    defaultWindow: "15m",
  },
  "register-user": {
    limitEnv: "BFF_RATE_LIMIT_REGISTER",
    windowEnv: "BFF_RATE_LIMIT_REGISTER_WINDOW",
    defaultLimit: 5,
    defaultWindow: "15m",
  },
};

let redisClient: Redis | null | undefined;
let warnedMissingRedis = false;

function upstashConfigured(): boolean {
  if (!isBffRateLimitEnabled()) {
    return false;
  }
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() &&
      process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
  );
}

function getRedis(): Redis | null {
  if (!upstashConfigured()) {
    return null;
  }
  if (redisClient === undefined) {
    redisClient = Redis.fromEnv();
  }
  return redisClient;
}

const limiterCache = new Map<BffRateLimitPolicy, Ratelimit>();

function getLimiter(policy: BffRateLimitPolicy): Ratelimit | null {
  const redis = getRedis();
  if (!redis) {
    return null;
  }
  const cached = limiterCache.get(policy);
  if (cached) {
    return cached;
  }
  const cfg = POLICY_CONFIG[policy];
  const limit = positiveInt(process.env[cfg.limitEnv], cfg.defaultLimit);
  const window = windowFromEnv(cfg.windowEnv, cfg.defaultWindow);
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window as Duration),
    prefix: `bb:bff:${policy}`,
    analytics: true,
  });
  limiterCache.set(policy, limiter);
  return limiter;
}

/** Resolves which bucket applies (aligned with Nest `routeHitLimits` where relevant). */
export function resolveBffRateLimitPolicy(
  pathname: string,
  method: string,
): BffRateLimitPolicy {
  const path = pathname.split("?")[0];
  const verb = method.toUpperCase();

  if (path === "/api/session" && verb === "POST") {
    return "session-establish";
  }
  if (path === "/api/account/profile/verify-password" && verb === "POST") {
    return "profile-verify-password";
  }
  if (path === "/api/account/verify-password" && verb === "POST") {
    return "account-verify-password";
  }
  if (path === "/api/account/register-user" && verb === "POST") {
    return "register-user";
  }
  return "default";
}

export function clientIp(request: NextRequest): string {
  if (process.env.BFF_RATE_LIMIT_TRUST_PROXY === "1") {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
      const first = forwarded.split(",")[0]?.trim();
      if (first) {
        return first;
      }
    }
    const realIp = request.headers.get("x-real-ip")?.trim();
    if (realIp) {
      return realIp;
    }
  }
  return "127.0.0.1";
}

export type BffRateLimitCheckResult = {
  enabled: boolean;
  policy: BffRateLimitPolicy;
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  pending?: Promise<unknown>;
};

/**
 * Returns `success: true` when rate limiting is disabled (no Upstash env).
 */
export async function checkBffRateLimit(
  request: NextRequest,
): Promise<BffRateLimitCheckResult> {
  const policy = resolveBffRateLimitPolicy(
    request.nextUrl.pathname,
    request.method,
  );
  const limiter = getLimiter(policy);

  if (!limiter) {
    if (
      process.env.NODE_ENV === "production" &&
      !warnedMissingRedis &&
      isBffRateLimitEnabled()
    ) {
      warnedMissingRedis = true;
      console.warn(
        "[bff-rate-limit] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN not set — BFF /api rate limiting is off.",
      );
    }
    return {
      enabled: false,
      policy,
      success: true,
      limit: 0,
      remaining: 0,
      reset: 0,
    };
  }

  const ip = clientIp(request);
  const identifier = `${ip}:${policy}`;
  const { success, limit, remaining, reset, pending } =
    await limiter.limit(identifier);

  return {
    enabled: true,
    policy,
    success,
    limit,
    remaining,
    reset,
    pending,
  };
}

export function applyRateLimitHeaders(
  headers: Headers,
  result: BffRateLimitCheckResult,
): void {
  if (!result.enabled) {
    return;
  }
  headers.set("X-RateLimit-Limit", String(result.limit));
  headers.set("X-RateLimit-Remaining", String(result.remaining));
  headers.set("X-RateLimit-Policy", result.policy);
  if (result.reset > 0) {
    headers.set("X-RateLimit-Reset", String(result.reset));
    if (!result.success) {
      const retryAfterSec = Math.max(
        0,
        Math.ceil((result.reset - Date.now()) / 1000),
      );
      if (retryAfterSec > 0) {
        headers.set("Retry-After", String(retryAfterSec));
      }
    }
  }
}
