import { Inject, Injectable } from '@nestjs/common';
import type { BlacklistClientIpInput } from '../../models/ip-access-api.types';
import {
  I_IP_BLACKLIST_STORE,
  type IIpBlacklistStore,
} from '../../ports/ip-blacklist-store.interface';

@Injectable()
export class BlacklistClientIpCommand {
  constructor(
    @Inject(I_IP_BLACKLIST_STORE)
    private readonly blacklistStore: IIpBlacklistStore,
  ) {}

  async execute(input: BlacklistClientIpInput): Promise<void> {
    const clientIp = input.clientIp.trim();
    if (!clientIp || clientIp === 'unknown') {
      return;
    }
    await this.blacklistStore.blacklist(clientIp, {
      reason: input.reason,
      at: new Date(),
    });
  }
}
