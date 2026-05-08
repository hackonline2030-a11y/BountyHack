import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../../../generated/prisma/client';
import { PostgreUser } from '../../../../users/adapters/postgre/postgre-user';

/**
 * Nest wrapper around Prisma Client (generated code stays in `src/generated/prisma`).
 * Used when `DATABASE_NAME=POSTGRESQL_PRISMA`.
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
