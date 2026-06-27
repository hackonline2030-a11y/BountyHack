import { Inject, Injectable } from '@nestjs/common';
import type { IpReallowEntryWire } from '../../models/ip-access-api.types';
import {
  I_IP_REALLOW_REPOSITORY,
  type IIpReallowRepository,
} from '../../ports/ip-reallow-repository.interface';

@Injectable()
export class ListIpReallowEntriesQuery {
  constructor(
    @Inject(I_IP_REALLOW_REPOSITORY)
    private readonly reallowRepository: IIpReallowRepository,
  ) {}

  execute(): Promise<IpReallowEntryWire[]> {
    return this.reallowRepository.listEntries();
  }
}
