import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type {
  CreateIpWhitelistEntryInput,
  IpAccessSettingsWire,
  IpWhitelistEntryWire,
  SetIpWhitelistEnabledInput,
} from '../../models/ip-access-api.types';
import type { IIpWhitelistRepository } from '../../ports/ip-whitelist-repository.interface';

/** In-memory whitelist when Prisma SQL is unavailable (tests / non-SQL modes). */
@Injectable()
export class InMemoryIpWhitelistRepository implements IIpWhitelistRepository {
  private settings: IpAccessSettingsWire = {
    ipWhitelistEnabled: false,
    updatedAt: new Date(0).toISOString(),
    updatedByUserId: null,
  };

  private readonly entries = new Map<string, IpWhitelistEntryWire>();

  async getSettings(): Promise<IpAccessSettingsWire> {
    return this.settings;
  }

  async setWhitelistModeEnabled(
    input: SetIpWhitelistEnabledInput,
  ): Promise<IpAccessSettingsWire> {
    this.settings = {
      ipWhitelistEnabled: input.enabled,
      updatedAt: new Date().toISOString(),
      updatedByUserId: input.updatedByUserId,
    };
    return this.settings;
  }

  async isWhitelistModeEnabled(): Promise<boolean> {
    return this.settings.ipWhitelistEnabled;
  }

  async findByCanonicalCidr(cidr: string): Promise<IpWhitelistEntryWire | null> {
    for (const entry of this.entries.values()) {
      if (entry.cidr === cidr) {
        return entry;
      }
    }
    return null;
  }

  async findEntryById(id: string): Promise<IpWhitelistEntryWire | null> {
    return this.entries.get(id) ?? null;
  }

  async listEntries(): Promise<IpWhitelistEntryWire[]> {
    return [...this.entries.values()];
  }

  async createEntry(
    input: CreateIpWhitelistEntryInput & { canonicalCidr: string },
  ): Promise<IpWhitelistEntryWire> {
    const entry: IpWhitelistEntryWire = {
      id: randomUUID(),
      cidr: input.canonicalCidr,
      label: input.label?.trim() || null,
      createdAt: new Date().toISOString(),
      createdByUserId: input.createdByUserId,
    };
    this.entries.set(entry.id, entry);
    return entry;
  }

  async deleteEntry(id: string): Promise<void> {
    this.entries.delete(id);
  }
}
