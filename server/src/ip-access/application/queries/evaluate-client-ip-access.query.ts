import { Inject, Injectable } from '@nestjs/common';
import type { IpAccessDecision } from '../../models/ip-access-api.types';
import {
  I_IP_BLACKLIST_STORE,
  type IIpBlacklistStore,
} from '../../ports/ip-blacklist-store.interface';
import { IpWhitelistSnapshotCache } from '../ip-whitelist-snapshot.cache';
import { IpReallowSnapshotCache } from '../ip-reallow-snapshot.cache';
import { isClientIpInCidrList } from '../utils/match-client-ip.util';

@Injectable()
export class EvaluateClientIpAccessQuery {
  constructor(
    @Inject(I_IP_BLACKLIST_STORE)
    private readonly blacklistStore: IIpBlacklistStore,
    private readonly reallowSnapshot: IpReallowSnapshotCache,
    private readonly whitelistSnapshot: IpWhitelistSnapshotCache,
  ) {}

  async execute(clientIp: string): Promise<IpAccessDecision> {
    const normalizedIp = clientIp.trim() || 'unknown';

    if (await this.blacklistStore.isBlacklisted(normalizedIp)) {
      const { cidrs: reallowCidrs } = await this.reallowSnapshot.getSnapshot();
      if (!isClientIpInCidrList(normalizedIp, reallowCidrs)) {
        return { code: 'DENY_BLACKLISTED', clientIp: normalizedIp };
      }
    }

    const { enabled, cidrs } = await this.whitelistSnapshot.getSnapshot();
    if (!enabled) {
      return { code: 'ALLOW', clientIp: normalizedIp };
    }

    if (isClientIpInCidrList(normalizedIp, cidrs)) {
      return { code: 'ALLOW', clientIp: normalizedIp };
    }

    return { code: 'DENY_NOT_WHITELISTED', clientIp: normalizedIp };
  }
}
