import { Injectable } from '@nestjs/common';
import type { BlacklistClientIpMeta } from '../../models/ip-access-api.types';
import type { IIpBlacklistStore } from '../../ports/ip-blacklist-store.interface';

@Injectable()
export class InMemoryIpBlacklistStore implements IIpBlacklistStore {
  private readonly entries = new Map<string, BlacklistClientIpMeta>();

  async isBlacklisted(clientIp: string): Promise<boolean> {
    return this.entries.has(clientIp);
  }

  async blacklist(clientIp: string, meta: BlacklistClientIpMeta): Promise<void> {
    this.entries.set(clientIp, meta);
  }

  async unblacklist(clientIp: string): Promise<void> {
    this.entries.delete(clientIp);
  }
}
