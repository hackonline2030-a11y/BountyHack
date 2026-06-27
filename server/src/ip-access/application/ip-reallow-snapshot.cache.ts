import { Inject, Injectable } from '@nestjs/common';
import { getIpWhitelistCacheTtlMs } from '../config/ip-access-env';
import {
  I_IP_REALLOW_REPOSITORY,
  type IIpReallowRepository,
} from '../ports/ip-reallow-repository.interface';

export type IpReallowSnapshot = {
  cidrs: readonly string[];
};

@Injectable()
export class IpReallowSnapshotCache {
  private cachedAt = 0;
  private snapshot: IpReallowSnapshot | null = null;

  constructor(
    @Inject(I_IP_REALLOW_REPOSITORY)
    private readonly reallowRepository: IIpReallowRepository,
  ) {}

  async getSnapshot(): Promise<IpReallowSnapshot> {
    const ttlMs = getIpWhitelistCacheTtlMs();
    const now = Date.now();
    if (this.snapshot && now < this.cachedAt + ttlMs) {
      return this.snapshot;
    }

    const entries = await this.reallowRepository.listEntries();
    this.snapshot = {
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
