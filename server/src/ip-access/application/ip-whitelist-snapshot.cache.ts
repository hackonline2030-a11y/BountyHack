import { Inject, Injectable } from '@nestjs/common';
import { getIpWhitelistCacheTtlMs } from '../config/ip-access-env';
import {
  I_IP_WHITELIST_REPOSITORY,
  type IIpWhitelistRepository,
} from '../ports/ip-whitelist-repository.interface';

export type IpWhitelistSnapshot = {
  enabled: boolean;
  cidrs: readonly string[];
};

@Injectable()
export class IpWhitelistSnapshotCache {
  private cachedAt = 0;
  private snapshot: IpWhitelistSnapshot | null = null;

  constructor(
    @Inject(I_IP_WHITELIST_REPOSITORY)
    private readonly whitelistRepository: IIpWhitelistRepository,
  ) {}

  async getSnapshot(): Promise<IpWhitelistSnapshot> {
    const ttlMs = getIpWhitelistCacheTtlMs();
    const now = Date.now();
    if (this.snapshot && now < this.cachedAt + ttlMs) {
      return this.snapshot;
    }

    const [enabled, entries] = await Promise.all([
      this.whitelistRepository.isWhitelistModeEnabled(),
      this.whitelistRepository.listEntries(),
    ]);

    this.snapshot = {
      enabled,
      cidrs: entries.map((entry) => entry.cidr),
    };
    this.cachedAt = now;
    return this.snapshot;
  }

  invalidate(): void {
    this.snapshot = null;
    this.cachedAt = 0;
  }
}
