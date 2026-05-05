import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import { IUserRepository } from '../../ports/user-repository.interface';
import { UserRecord } from '../../models';
import { CreateUserProfilePayload } from '../../payloads';
import { PostgreUser } from './postgre-user';
import { USER_PG_POOL } from './postgre-pool.token';

@Injectable()
export class PostgreUserRepository implements IUserRepository {
  constructor(@Inject(USER_PG_POOL) private readonly pool: Pool) {}

  async addUsername(user: CreateUserProfilePayload): Promise<void> {
    await this.pool.query(
      `INSERT INTO ${PostgreUser.TABLE_NAME} (id, username)
       VALUES ($1, $2)
       ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username`,
      [user.uid, user.username],
    );
  }

  async findById(id: string): Promise<UserRecord | null> {
    const { rows } = await this.pool.query<Pick<PostgreUser.Row, 'id' | 'username'>>(
      `SELECT id, username FROM ${PostgreUser.TABLE_NAME} WHERE id = $1`,
      [id],
    );
    const row = rows[0];
    if (!row) {
      return null;
    }
    return { uid: row.id, username: row.username };
  }
}
