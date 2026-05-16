import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/infrastructure/database/prisma/prisma.service';
import { isMysqlPrismaMode } from '../../shared/database-mode';
import { IPingRepository } from '../ping-repository.interface';
import { DatabaseStatus, DatabaseVersion } from '../ping.entity';

/** Ping via Prisma when `DATABASE_NAME` is `POSTGRESQL_PRISMA` or `MYSQL_PRISMA`. */
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
      const rows = isMysqlPrismaMode()
        ? await this.prisma.$queryRaw<{ version: string }[]>`
            SELECT VERSION() AS version
          `
        : await this.prisma.$queryRaw<{ version: string }[]>`
            SELECT version() AS version
          `;
      const version = rows[0]?.version?.trim() ?? 'unknown';
      return { version };
    } catch {
      return { version: 'unknown' };
    }
  }
}
