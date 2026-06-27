import type {
  CreateIpReallowEntryInput,
  IpReallowEntryWire,
} from '../models/ip-access-api.types';

export const I_IP_REALLOW_REPOSITORY = Symbol('I_IP_REALLOW_REPOSITORY');

export interface IIpReallowRepository {
  findByCanonicalCidr(cidr: string): Promise<IpReallowEntryWire | null>;
  findEntryById(id: string): Promise<IpReallowEntryWire | null>;
  listEntries(): Promise<IpReallowEntryWire[]>;
  createEntry(
    input: CreateIpReallowEntryInput & { canonicalCidr: string },
  ): Promise<IpReallowEntryWire>;
  deleteEntry(id: string): Promise<void>;
}
