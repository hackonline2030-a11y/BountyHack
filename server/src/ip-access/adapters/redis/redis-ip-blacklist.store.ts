import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import {
  getIpBlacklistRedisPrefix,
  getIpBlacklistTtlSeconds,
} from '../../config/ip-access-env';
import type { BlacklistClientIpMeta, IpBlacklistEntryWire } from '../../models/ip-access-api.types';
import type { IIpBlacklistStore } from '../../ports/ip-blacklist-store.interface';

@Injectable()
export class RedisIpBlacklistStore implements IIpBlacklistStore, OnModuleDestroy {
  private readonly redis: Redis;
  private readonly prefix: string;
  private readonly ttlSeconds: number;

  constructor(config: ConfigService) {
    const explicitUrl = config.get<string>('REDIS_URL')?.trim();
    const host = config.get<string>('REDIS_HOST', '127.0.0.1');
    const port = config.get<string>('REDIS_PORT', '6379');
    const password = config.get<string>('REDIS_PASSWORD')?.trim();
    const url =
      explicitUrl ||
      (password
        ? `redis://:${encodeURIComponent(password)}@${host}:${port}`
        : `redis://${host}:${port}`);

    this.redis = new Redis(url, { maxRetriesPerRequest: 1 });
    this.prefix = getIpBlacklistRedisPrefix();
    this.ttlSeconds = getIpBlacklistTtlSeconds();
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }

  async isBlacklisted(clientIp: string): Promise<boolean> {
    const key = this.keyFor(clientIp);
    const hit = await this.redis.exists(key);
    return hit === 1;
  }

  async blacklist(clientIp: string, meta: BlacklistClientIpMeta): Promise<void> {
    const key = this.keyFor(clientIp);
    const payload = JSON.stringify({
      reason: meta.reason,
      at: meta.at.toISOString(),
    });
    if (this.ttlSeconds > 0) {
      await this.redis.set(key, payload, 'EX', this.ttlSeconds);
      return;
    }
    await this.redis.set(key, payload);
  }

  async unblacklist(clientIp: string): Promise<void> {
    await this.redis.del(this.keyFor(clientIp));
  }

  async listEntries(): Promise<IpBlacklistEntryWire[]> {
    const entries: IpBlacklistEntryWire[] = [];
    let cursor = '0';
    do {
      const [next, keys] = await this.redis.scan(
        cursor,
        'MATCH',
        `${this.prefix}*`,
        'COUNT',
        100,
      );
      cursor = next;
      for (const key of keys) {
        const clientIp = key.slice(this.prefix.length);
        if (!clientIp) {
          continue;
        }
        const raw = await this.redis.get(key);
        if (!raw) {
          continue;
        }
        try {
          const parsed = JSON.parse(raw) as { reason?: string; at?: string };
          entries.push({
            clientIp,
            reason: parsed.reason ?? 'unknown',
            blacklistedAt: parsed.at ?? new Date().toISOString(),
          });
        } catch {
          entries.push({
            clientIp,
            reason: 'unknown',
            blacklistedAt: new Date().toISOString(),
          });
        }
      }
    } while (cursor !== '0');

    return entries.sort((a, b) =>
      b.blacklistedAt.localeCompare(a.blacklistedAt),
    );
  }

  private keyFor(clientIp: string): string {
    return `${this.prefix}${clientIp}`;
  }
}
