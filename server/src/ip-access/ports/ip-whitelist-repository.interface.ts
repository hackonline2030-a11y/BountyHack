import type {
  CreateIpWhitelistEntryInput,
  IpAccessSettingsWire,
  IpWhitelistEntryWire,
  SetIpWhitelistEnabledInput,
} from '../models/ip-access-api.types';

export const I_IP_WHITELIST_REPOSITORY = Symbol('I_IP_WHITELIST_REPOSITORY');

export interface IIpWhitelistRepository {
  getSettings(): Promise<IpAccessSettingsWire>;
  setWhitelistModeEnabled(input: SetIpWhitelistEnabledInput): Promise<IpAccessSettingsWire>;
  isWhitelistModeEnabled(): Promise<boolean>;
  findByCanonicalCidr(cidr: string): Promise<IpWhitelistEntryWire | null>;
  findEntryById(id: string): Promise<IpWhitelistEntryWire | null>;
  listEntries(): Promise<IpWhitelistEntryWire[]>;
  createEntry(input: CreateIpWhitelistEntryInput & { canonicalCidr: string }): Promise<IpWhitelistEntryWire>;
  deleteEntry(id: string): Promise<void>;
}
