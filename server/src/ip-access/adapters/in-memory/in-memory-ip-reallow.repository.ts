import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type {
  CreateIpReallowEntryInput,
  IpReallowEntryWire,
} from '../../models/ip-access-api.types';
import type { IIpReallowRepository } from '../../ports/ip-reallow-repository.interface';

@Injectable()
export class InMemoryIpReallowRepository implements IIpReallowRepository {
  private readonly entries = new Map<string, IpReallowEntryWire>();

  async findByCanonicalCidr(cidr: string): Promise<IpReallowEntryWire | null> {
    for (const entry of this.entries.values()) {
      if (entry.cidr === cidr) {
        return entry;
      }
    }
    return null;
  }

  async findEntryById(id: string): Promise<IpReallowEntryWire | null> {
    return this.entries.get(id) ?? null;
  }

  async listEntries(): Promise<IpReallowEntryWire[]> {
    return [...this.entries.values()];
  }

  async createEntry(
    input: CreateIpReallowEntryInput & { canonicalCidr: string },
  ): Promise<IpReallowEntryWire> {
    const entry: IpReallowEntryWire = {
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
