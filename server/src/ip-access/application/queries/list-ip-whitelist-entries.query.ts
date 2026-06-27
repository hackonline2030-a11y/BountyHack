import { Inject, Injectable } from '@nestjs/common';
import type {
  IpAccessSettingsWire,
  IpWhitelistEntryWire,
} from '../../models/ip-access-api.types';
import {
  I_IP_WHITELIST_REPOSITORY,
  type IIpWhitelistRepository,
} from '../../ports/ip-whitelist-repository.interface';

@Injectable()
export class ListIpWhitelistEntriesQuery {
  constructor(
    @Inject(I_IP_WHITELIST_REPOSITORY)
    private readonly whitelistRepository: IIpWhitelistRepository,
  ) {}

  async execute(): Promise<{
    settings: IpAccessSettingsWire;
    entries: IpWhitelistEntryWire[];
  }> {
    const [settings, entries] = await Promise.all([
      this.whitelistRepository.getSettings(),
      this.whitelistRepository.listEntries(),
    ]);
    return { settings, entries };
  }
}
