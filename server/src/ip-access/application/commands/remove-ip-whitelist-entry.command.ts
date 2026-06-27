import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { IpAccessActor } from '../../models/ip-access-actor';
import {
  I_IP_WHITELIST_REPOSITORY,
  type IIpWhitelistRepository,
} from '../../ports/ip-whitelist-repository.interface';
import { IpWhitelistSnapshotCache } from '../ip-whitelist-snapshot.cache';

@Injectable()
export class RemoveIpWhitelistEntryCommand {
  constructor(
    @Inject(I_IP_WHITELIST_REPOSITORY)
    private readonly whitelistRepository: IIpWhitelistRepository,
    private readonly whitelistSnapshot: IpWhitelistSnapshotCache,
  ) {}

  async execute(_actor: IpAccessActor, id: string): Promise<void> {
    const entry = await this.whitelistRepository.findEntryById(id);
    if (!entry) {
      throw new NotFoundException('Whitelist entry not found');
    }

    await this.whitelistRepository.deleteEntry(id);
    this.whitelistSnapshot.invalidate();
  }
}
