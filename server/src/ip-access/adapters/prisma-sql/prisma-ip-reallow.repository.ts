import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../core/infrastructure/database/prisma/prisma.service';
import type {
  CreateIpReallowEntryInput,
  IpReallowEntryWire,
} from '../../models/ip-access-api.types';
import type { IIpReallowRepository } from '../../ports/ip-reallow-repository.interface';
import { IpAccessPrismaMapper } from './ip-access-prisma.mapper';

@Injectable()
export class PrismaIpReallowRepository implements IIpReallowRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByCanonicalCidr(cidr: string): Promise<IpReallowEntryWire | null> {
    const row = await this.prisma.ipReallowEntry.findUnique({
      where: { cidr },
    });
    return row ? IpAccessPrismaMapper.reallowEntryToWire(row) : null;
  }

  async findEntryById(id: string): Promise<IpReallowEntryWire | null> {
    const row = await this.prisma.ipReallowEntry.findUnique({
      where: { id },
    });
    return row ? IpAccessPrismaMapper.reallowEntryToWire(row) : null;
  }

  async listEntries(): Promise<IpReallowEntryWire[]> {
    const rows = await this.prisma.ipReallowEntry.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => IpAccessPrismaMapper.reallowEntryToWire(row));
  }

  async createEntry(
    input: CreateIpReallowEntryInput & { canonicalCidr: string },
  ): Promise<IpReallowEntryWire> {
    const row = await this.prisma.ipReallowEntry.create({
      data: {
        id: randomUUID(),
        cidr: input.canonicalCidr,
        label: input.label?.trim() || null,
        createdByUserId: input.createdByUserId,
      },
    });
    return IpAccessPrismaMapper.reallowEntryToWire(row);
  }

  async deleteEntry(id: string): Promise<void> {
    await this.prisma.ipReallowEntry.delete({ where: { id } });
  }
}
