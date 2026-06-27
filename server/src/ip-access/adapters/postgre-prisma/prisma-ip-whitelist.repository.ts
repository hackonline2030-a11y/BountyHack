import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../core/infrastructure/database/prisma/prisma.service';
import type {
  CreateIpWhitelistEntryInput,
  IpAccessSettingsWire,
  IpWhitelistEntryWire,
  SetIpWhitelistEnabledInput,
} from '../../models/ip-access-api.types';
import type { IIpWhitelistRepository } from '../../ports/ip-whitelist-repository.interface';
import { IpAccessPrismaMapper } from './ip-access-prisma.mapper';

const SETTINGS_ID = 1;

@Injectable()
export class PrismaIpWhitelistRepository implements IIpWhitelistRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(): Promise<IpAccessSettingsWire> {
    const row = await this.ensureSettingsRow();
    return IpAccessPrismaMapper.settingsToWire(row);
  }

  async setWhitelistModeEnabled(
    input: SetIpWhitelistEnabledInput,
  ): Promise<IpAccessSettingsWire> {
    const row = await this.prisma.ipAccessSettings.upsert({
      where: { id: SETTINGS_ID },
      create: {
        id: SETTINGS_ID,
        ipWhitelistEnabled: input.enabled,
        updatedByUserId: input.updatedByUserId,
      },
      update: {
        ipWhitelistEnabled: input.enabled,
        updatedByUserId: input.updatedByUserId,
      },
    });
    return IpAccessPrismaMapper.settingsToWire(row);
  }

  async isWhitelistModeEnabled(): Promise<boolean> {
    const row = await this.ensureSettingsRow();
    return row.ipWhitelistEnabled;
  }

  async findByCanonicalCidr(cidr: string): Promise<IpWhitelistEntryWire | null> {
    const row = await this.prisma.ipWhitelistEntry.findUnique({
      where: { cidr },
    });
    return row ? IpAccessPrismaMapper.entryToWire(row) : null;
  }

  async findEntryById(id: string): Promise<IpWhitelistEntryWire | null> {
    const row = await this.prisma.ipWhitelistEntry.findUnique({
      where: { id },
    });
    return row ? IpAccessPrismaMapper.entryToWire(row) : null;
  }

  async listEntries(): Promise<IpWhitelistEntryWire[]> {
    const rows = await this.prisma.ipWhitelistEntry.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => IpAccessPrismaMapper.entryToWire(row));
  }

  async createEntry(
    input: CreateIpWhitelistEntryInput & { canonicalCidr: string },
  ): Promise<IpWhitelistEntryWire> {
    const row = await this.prisma.ipWhitelistEntry.create({
      data: {
        id: randomUUID(),
        cidr: input.canonicalCidr,
        label: input.label?.trim() || null,
        createdByUserId: input.createdByUserId,
      },
    });
    return IpAccessPrismaMapper.entryToWire(row);
  }

  async deleteEntry(id: string): Promise<void> {
    await this.prisma.ipWhitelistEntry.delete({ where: { id } });
  }

  private async ensureSettingsRow() {
    return this.prisma.ipAccessSettings.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID },
      update: {},
    });
  }
}
