import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../../../../generated/prisma/client';
import {
  isMysqlPrismaMode,
  isPostgresqlPrismaMode,
} from '../../../../shared/database-mode';
import {
  CREATE_PG_PASSWORD_RESET_TOKENS_TABLE_SQL,
  CREATE_PG_PASSWORD_RESET_TOKENS_USER_ID_INDEX_SQL,
  CREATE_PG_REFRESH_TOKENS_TABLE_SQL,
  CREATE_PG_REFRESH_TOKENS_USER_ID_INDEX_SQL,
  CREATE_PG_USERS_TABLE_SQL,
  ENSURE_PG_USERS_TWO_FACTOR_COLUMN_SQL,
} from '../postgres-users-ddl';

/**
 * Nest wrapper around Prisma Client (generated code stays in `src/generated/prisma`).
 * Used when `DATABASE_NAME` is `POSTGRESQL_PRISMA` or `MYSQL_PRISMA`.
 *
 * Run `pnpm prisma:generate` with matching `DATABASE_NAME` so the client matches the provider.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const url = process.env.DATABASE_URL?.trim();
    if (!url) {
      throw new Error(
        'DATABASE_URL is required when using Prisma (POSTGRESQL_PRISMA or MYSQL_PRISMA)',
      );
    }
    const adapter = isMysqlPrismaMode()
      ? new PrismaMariaDb(url)
      : new PrismaPg(url);
    super({ adapter });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    if (isPostgresqlPrismaMode()) {
      await this.runPostgresqlLegacyBootstrapDdl();
    }
  }

  private async runPostgresqlLegacyBootstrapDdl(): Promise<void> {
    await this.$executeRawUnsafe(String(CREATE_PG_USERS_TABLE_SQL).trim());
    await this.$executeRawUnsafe(
      String(ENSURE_PG_USERS_TWO_FACTOR_COLUMN_SQL).trim(),
    );
    await this.$executeRawUnsafe(
      String(CREATE_PG_REFRESH_TOKENS_TABLE_SQL).trim(),
    );
    await this.$executeRawUnsafe(
      String(CREATE_PG_REFRESH_TOKENS_USER_ID_INDEX_SQL).trim(),
    );
    await this.$executeRawUnsafe(
      String(CREATE_PG_PASSWORD_RESET_TOKENS_TABLE_SQL).trim(),
    );
    await this.$executeRawUnsafe(
      String(CREATE_PG_PASSWORD_RESET_TOKENS_USER_ID_INDEX_SQL).trim(),
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
