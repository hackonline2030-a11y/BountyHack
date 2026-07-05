import type { IpWhitelistEntry } from '../../../generated/prisma/client';
import type {
  IpAccessSettingsWire,
  IpWhitelistEntryWire,
} from '../../models/ip-access-api.types';

export class IpAccessPrismaMapper {
  static settingsToWire(row: {
    ipWhitelistEnabled: boolean;
    updatedAt: Date;
    updatedByUserId: string | null;
  }): IpAccessSettingsWire {
    return {
      ipWhitelistEnabled: row.ipWhitelistEnabled,
      updatedAt: row.updatedAt.toISOString(),
      updatedByUserId: row.updatedByUserId,
    };
  }

  static entryToWire(row: IpWhitelistEntry): IpWhitelistEntryWire {
    return {
      id: row.id,
      cidr: row.cidr,
      label: row.label,
      createdAt: row.createdAt.toISOString(),
      createdByUserId: row.createdByUserId,
    };
  }
}
