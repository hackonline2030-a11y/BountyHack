import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
} from '@nestjs/common';
import type { IpAccessActor } from '../../models/ip-access-actor';
import type { IpWhitelistEntryWire } from '../../models/ip-access-api.types';
import {
  I_IP_WHITELIST_REPOSITORY,
  type IIpWhitelistRepository,
} from '../../ports/ip-whitelist-repository.interface';
import { IpWhitelistSnapshotCache } from '../ip-whitelist-snapshot.cache';
import { CidrValidationError, normalizeCidr } from '../utils/cidr-normalize.util';

@Injectable()
export class AddIpWhitelistEntryCommand {
  constructor(
    @Inject(I_IP_WHITELIST_REPOSITORY)
    private readonly whitelistRepository: IIpWhitelistRepository,
    private readonly whitelistSnapshot: IpWhitelistSnapshotCache,
  ) {}

  async execute(
    actor: IpAccessActor,
    input: { cidr: string; label?: string | null },
  ): Promise<IpWhitelistEntryWire> {
    let canonicalCidr: string;
    try {
      canonicalCidr = normalizeCidr(input.cidr);
    } catch (error) {
      if (error instanceof CidrValidationError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }

    const existing = await this.whitelistRepository.findByCanonicalCidr(
      canonicalCidr,
    );
    if (existing) {
      throw new ConflictException('This CIDR is already whitelisted');
    }

    const entry = await this.whitelistRepository.createEntry({
      cidr: input.cidr,
      canonicalCidr,
      label: input.label,
      createdByUserId: actor.userId,
    });
    this.whitelistSnapshot.invalidate();
    return entry;
  }
}
