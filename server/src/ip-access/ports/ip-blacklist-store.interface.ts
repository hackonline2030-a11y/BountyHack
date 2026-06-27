import type { BlacklistClientIpMeta } from '../models/ip-access-api.types';

export const I_IP_BLACKLIST_STORE = Symbol('I_IP_BLACKLIST_STORE');

export interface IIpBlacklistStore {
  isBlacklisted(clientIp: string): Promise<boolean>;
  blacklist(clientIp: string, meta: BlacklistClientIpMeta): Promise<void>;
  unblacklist(clientIp: string): Promise<void>;
}
