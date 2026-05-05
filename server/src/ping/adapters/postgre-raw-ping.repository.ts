import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import { USER_PG_POOL } from '../../users/adapters/postgre/postgre-pool.token';
import { IPingRepository } from '../ping-repository.interface';
import { DatabaseStatus, DatabaseVersion } from '../ping.entity';

/** Ping via `pg` pool when `DATABASE_NAME=POSTGRESQL`. */
@Injectable()
export class PostgreRawPingRepository implements IPingRepository {
  constructor(@Inject(USER_PG_POOL) private readonly pool: Pool) {}

  async getDatabaseStatus(): Promise<DatabaseStatus> {
    try {
      await this.pool.query('SELECT 1');
      return { status: 'OK' };
    } catch {
      return { status: 'KO' };
    }
  }

  async getDatabaseVersion(): Promise<DatabaseVersion> {
    try {
      const r = await this.pool.query<{ version: string }>('SELECT version() AS version');
      const version = r.rows[0]?.version?.trim() ?? 'unknown';
      return { version };
    } catch {
      return { version: 'unknown' };
    }
  }
}
