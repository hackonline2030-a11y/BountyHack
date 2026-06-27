import { Inject, Injectable } from '@nestjs/common';
import type { IpBlacklistEntryWire } from '../../models/ip-access-api.types';
import {
  I_IP_BLACKLIST_STORE,
  type IIpBlacklistStore,
} from '../../ports/ip-blacklist-store.interface';

@Injectable()
export class ListIpBlacklistEntriesQuery {
  constructor(
    @Inject(I_IP_BLACKLIST_STORE)
    private readonly blacklistStore: IIpBlacklistStore,
  ) {}

  execute(): Promise<IpBlacklistEntryWire[]> {
    return this.blacklistStore.listEntries();
  }
}
