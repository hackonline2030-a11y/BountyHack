import { Inject, Injectable } from '@nestjs/common';
import type { IpAccessActor } from '../../models/ip-access-actor';
import type { IpAccessSettingsWire } from '../../models/ip-access-api.types';
import {
  I_IP_WHITELIST_REPOSITORY,
  type IIpWhitelistRepository,
} from '../../ports/ip-whitelist-repository.interface';
import { IpWhitelistSnapshotCache } from '../ip-whitelist-snapshot.cache';

@Injectable()
export class SetIpWhitelistEnabledCommand {
  constructor(
    @Inject(I_IP_WHITELIST_REPOSITORY)
    private readonly whitelistRepository: IIpWhitelistRepository,
    private readonly whitelistSnapshot: IpWhitelistSnapshotCache,
  ) {}

  async execute(
    actor: IpAccessActor,
    enabled: boolean,
  ): Promise<IpAccessSettingsWire> {
    const settings = await this.whitelistRepository.setWhitelistModeEnabled({
      enabled,
      updatedByUserId: actor.userId,
    });
    this.whitelistSnapshot.invalidate();
    return settings;
  }
}
