import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { PostgreUser } from '../users/adapters/postgre/postgre-user';

/**
 * Prisma Client with [`pg` driver adapter](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections/postgresql) — used when `DATABASE_NAME=POSTGRESQL_PRISMA`.
 *
 * Ensures the same `users` DDL as the raw `pg` path (`PostgreUser.CREATE_TABLE_SQL`) for a frictionless switch.
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
        'DATABASE_URL is required when using Prisma (POSTGRESQL_PRISMA)',
      );
    }
    const adapter = new PrismaPg(url);
    super({ adapter });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    await this.$executeRawUnsafe(String(PostgreUser.CREATE_TABLE_SQL).trim());
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
