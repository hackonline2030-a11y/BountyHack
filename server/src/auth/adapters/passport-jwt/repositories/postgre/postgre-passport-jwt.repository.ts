import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { Pool } from 'pg';
import { randomUUID } from 'crypto';
import { USER_PG_POOL } from '../../../../../users/adapters/postgre/postgre-pool.token';
import { PostgreUser } from '../../../../../users/adapters/postgre/postgre-user';
import { Identity } from '../../../../domain/models/identity';
import { verifyPassword, hashPassword } from '../../../password.util';
import { PassportJwtTokenService } from '../../services/passport-jwt-token.service';
import {
  PassportJwtAuthResult,
  PassportJwtLoginInput,
  PassportJwtPersistence,
  PassportJwtRegisterInput,
} from '../passport-jwt-persistence.repository';

@Injectable()
export class PostgrePassportJwtRepository
  implements PassportJwtPersistence
{
  constructor(
    private readonly jwtTokenService: PassportJwtTokenService,
    @Optional()
    @Inject(USER_PG_POOL)
    private readonly pool?: Pool,
  ) {}

  async getUserByUid(uid: string): Promise<Identity> {
    if (!this.pool) {
      throw new InternalServerErrorException('PostgreSQL pool is not available');
    }
    const query = `SELECT id, email FROM ${PostgreUser.TABLE_NAME} WHERE id = $1 LIMIT 1`;
    const { rows } = await this.pool.query<{ id: string; email: string | null }>(
      query,
      [uid],
    );
    const row = rows[0];
    if (!row) {
      throw new UnauthorizedException('User not found');
    }
    return { uid: row.id, email: row.email ?? '' };
  }

  async register(input: PassportJwtRegisterInput): Promise<PassportJwtAuthResult> {
    if (!this.pool) {
      throw new InternalServerErrorException('PostgreSQL pool is not available');
    }
    const email = input.email.trim().toLowerCase();
    const username = input.username.trim();

    const existingQuery = `SELECT id FROM ${PostgreUser.TABLE_NAME} WHERE email = $1 LIMIT 1`;
    const existing = await this.pool.query<{ id: string }>(existingQuery, [email]);
    if (existing.rows.length > 0) {
      throw new ConflictException('Email already registered');
    }

    const uid = randomUUID();
    const passwordHash = await hashPassword(input.password);
    const insertQuery = `
      INSERT INTO ${PostgreUser.TABLE_NAME} (id, username, email, password_hash)
      VALUES ($1, $2, $3, $4)
    `;
    try {
      await this.pool.query(insertQuery, [uid, username, email, passwordHash]);
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      if (code === '23505') {
        throw new ConflictException('Email already registered');
      }
      throw error;
    }

    return {
      token: this.jwtTokenService.signToken(uid, email),
      user: { email, uid, username },
      require2FA: false,
    };
  }

  async login(input: PassportJwtLoginInput): Promise<PassportJwtAuthResult> {
    if (!this.pool) {
      throw new InternalServerErrorException('PostgreSQL pool is not available');
    }
    const email = input.email.trim().toLowerCase();
    const query = `
      SELECT id, username, email, password_hash
      FROM ${PostgreUser.TABLE_NAME}
      WHERE email = $1
      LIMIT 1
    `;
    const { rows } = await this.pool.query<PostgreUser.Row>(query, [email]);
    const row = rows[0];

    if (!row?.password_hash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const ok = await verifyPassword(input.password, row.password_hash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      token: this.jwtTokenService.signToken(row.id, row.email ?? email),
      user: {
        email: row.email ?? email,
        uid: row.id,
        username: row.username,
      },
      require2FA: false,
    };
  }
}
