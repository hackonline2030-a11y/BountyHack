import { Injectable } from '@nestjs/common';
import type { IpAccessDecision } from '../../models/ip-access-api.types';
import { IpWhitelistSnapshotCache } from '../ip-whitelist-snapshot.cache';
import { isClientIpInCidrList } from '../utils/match-client-ip.util';

@Injectable()
export class EvaluateClientIpAccessQuery {
  constructor(private readonly whitelistSnapshot: IpWhitelistSnapshotCache) {}

  async execute(clientIp: string): Promise<IpAccessDecision> {
    const normalizedIp = clientIp.trim() || 'unknown';

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
