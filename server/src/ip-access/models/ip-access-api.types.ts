export type IpAccessDecisionCode = 'ALLOW' | 'DENY_NOT_WHITELISTED';

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

export type SetIpWhitelistEnabledInput = {
  enabled: boolean;
  updatedByUserId: string;
};
