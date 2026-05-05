import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { IPingRepository } from '../ping-repository.interface';
import { DatabaseStatus, DatabaseVersion } from '../ping.entity';

/** Ping via Prisma when `DATABASE_NAME=POSTGRESQL_PRISMA` (same DB as raw Postgres). */
@Injectable()
export class PostgrePrismaPingRepository implements IPingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getDatabaseStatus(): Promise<DatabaseStatus> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'OK' };
    } catch {
      return { status: 'KO' };
    }
  }

  async getDatabaseVersion(): Promise<DatabaseVersion> {
    try {
      const rows = await this.prisma.$queryRaw<{ version: string }[]>`
        SELECT version() AS version
      `;
      const version = rows[0]?.version?.trim() ?? 'unknown';
      return { version };
    } catch {
      return { version: 'unknown' };
    }
  }
}
