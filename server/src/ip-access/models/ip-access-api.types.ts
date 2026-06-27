export type IpAccessDecisionCode =
  | 'ALLOW'
  | 'DENY_BLACKLISTED'
  | 'DENY_NOT_WHITELISTED';

export type IpAccessDecision = {
  code: IpAccessDecisionCode;
  clientIp: string;
};

export type IpWhitelistEntryWire = {
  id: string;
  cidr: string;
  label: string | null;
  createdAt: string;
  createdByUserId: string;
};

/** Same shape as whitelist row — persisted bypass for ephemeral blacklist. */
export type IpReallowEntryWire = IpWhitelistEntryWire;

export type IpAccessSettingsWire = {
  ipWhitelistEnabled: boolean;
  updatedAt: string;
  updatedByUserId: string | null;
};

export type CreateIpWhitelistEntryInput = {
  cidr: string;
  label?: string | null;
  createdByUserId: string;
};

export type CreateIpReallowEntryInput = CreateIpWhitelistEntryInput;

export type BlacklistClientIpMeta = {
  reason: string;
  at: Date;
};

export type BlacklistClientIpInput = {
  clientIp: string;
  reason: string;
};

export type IpBlacklistEntryWire = {
  clientIp: string;
  reason: string;
  blacklistedAt: string;
};

export type SetIpWhitelistEnabledInput = {
  enabled: boolean;
  updatedByUserId: string;
};
