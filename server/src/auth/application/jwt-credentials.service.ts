import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import type { Pool } from 'pg';
import { randomUUID } from 'crypto';
import { sign } from 'jsonwebtoken';
import { MongoUser } from '../../users/adapters/mongo/mongo-user';
import { USER_PG_POOL } from '../../users/adapters/postgre/postgre-pool.token';
import { PostgreUser } from '../../users/adapters/postgre/postgre-user';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { variables } from '../../shared/variables.config';
import { hashPassword, verifyPassword } from '../infra/password.util';
import { JwtInMemoryRegistry } from '../infra/jwt-in-memory-registry';

export interface JwtAuthResponseBody {
  token: string;
  user: { email: string; uid: string; username: string };
}

@Injectable()
export class JwtCredentialsService {
  constructor(
    private readonly jwtRegistry: JwtInMemoryRegistry,
    @Optional()
    @Inject(getModelToken(MongoUser.CollectionName))
    private readonly userModel?: Model<MongoUser.SchemaClass>,
    @Optional()
    @Inject(USER_PG_POOL)
    private readonly pgPool?: Pool,
    @Optional()
    private readonly prismaService?: PrismaService
  ) {}

  async register(input: {
    username: string;
    email: string;
    password: string;
  }): Promise<JwtAuthResponseBody> {
    const email = input.email.trim().toLowerCase();
    if (!email || !input.username?.trim() || !input.password) {
      throw new UnauthorizedException('Missing credentials');
    }

    if (variables.database === 'MONGODB') {
      return this.registerMongo(email, input.username.trim(), input.password);
    }

    if (variables.database === 'POSTGRESQL') {
      return this.registerPostgres(email, input.username.trim(), input.password);
    }

    if (variables.database === 'POSTGRESQL_PRISMA') {
      return this.registerPostgresPrisma(email, input.username.trim(), input.password);
    }

    if (variables.database === 'IN-MEMORY') {
      return this.registerInMemory(email, input.username.trim(), input.password);
    }

    throw new InternalServerErrorException(
      'JWT register is only supported with DATABASE_NAME=MONGODB, POSTGRESQL, POSTGRESQL_PRISMA, or IN-MEMORY'
    );
  }

  async login(input: {
    email: string;
    password: string;
  }): Promise<JwtAuthResponseBody> {
    const email = input.email.trim().toLowerCase();
    if (!email || !input.password) {
      throw new UnauthorizedException('Missing credentials');
    }

    if (variables.database === 'MONGODB') {
      return this.loginMongo(email, input.password);
    }

    if (variables.database === 'POSTGRESQL') {
      return this.loginPostgres(email, input.password);
    }

    if (variables.database === 'POSTGRESQL_PRISMA') {
      return this.loginPostgresPrisma(email, input.password);
    }

    if (variables.database === 'IN-MEMORY') {
      return this.loginInMemory(email, input.password);
    }

    throw new InternalServerErrorException(
      'JWT login is only supported with DATABASE_NAME=MONGODB, POSTGRESQL, POSTGRESQL_PRISMA, or IN-MEMORY'
    );
  }

  private async registerMongo(
    email: string,
    username: string,
    password: string
  ): Promise<JwtAuthResponseBody> {
    if (!this.userModel) {
      throw new InternalServerErrorException('Mongo user model is not available');
    }

    const existing = await this.userModel.findOne({ email });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const uid = randomUUID();
    const passwordHash = await hashPassword(password);

    try {
      await this.userModel.create({
        _id: uid,
        username,
        email,
        passwordHash,
      });
    } catch (err: unknown) {
      const code = (err as { code?: number })?.code;
      if (code === 11000) {
        throw new ConflictException('Email already registered');
      }
      throw err;
    }

    return {
      token: this.signToken(uid, email),
      user: { email, uid, username },
    };
  }

  private async loginMongo(
    email: string,
    password: string
  ): Promise<JwtAuthResponseBody> {
    if (!this.userModel) {
      throw new InternalServerErrorException('Mongo user model is not available');
    }

    const doc = await this.userModel.findOne({ email });
    if (!doc?.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const ok = await verifyPassword(password, doc.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      token: this.signToken(doc._id, doc.email ?? email),
      user: {
        email: doc.email ?? email,
        uid: doc._id,
        username: doc.username,
      },
    };
  }

  private async registerPostgres(
    email: string,
    username: string,
    password: string
  ): Promise<JwtAuthResponseBody> {
    if (!this.pgPool) {
      throw new InternalServerErrorException('Postgres pool is not available');
    }

    const uid = randomUUID();
    const passwordHash = await hashPassword(password);

    try {
      await this.pgPool.query(
        `INSERT INTO ${PostgreUser.TABLE_NAME} (id, username, email, password_hash)
         VALUES ($1, $2, $3, $4)`,
        [uid, username, email, passwordHash]
      );
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === '23505') {
        throw new ConflictException('Email already registered');
      }
      throw err;
    }

    return {
      token: this.signToken(uid, email),
      user: { email, uid, username },
    };
  }

  private async loginPostgres(
    email: string,
    password: string
  ): Promise<JwtAuthResponseBody> {
    if (!this.pgPool) {
      throw new InternalServerErrorException('Postgres pool is not available');
    }

    const { rows } = await this.pgPool.query<{
      id: string;
      username: string;
      email: string | null;
      password_hash: string | null;
    }>(
      `SELECT id, username, email, password_hash FROM ${PostgreUser.TABLE_NAME}
       WHERE lower(email) = lower($1)`,
      [email]
    );

    const row = rows[0];
    if (!row?.password_hash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const ok = await verifyPassword(password, row.password_hash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      token: this.signToken(row.id, row.email ?? email),
      user: {
        email: row.email ?? email,
        uid: row.id,
        username: row.username,
      },
    };
  }

  private async registerPostgresPrisma(
    email: string,
    username: string,
    password: string
  ): Promise<JwtAuthResponseBody> {
    if (!this.prismaService) {
      throw new InternalServerErrorException('PrismaService is not available');
    }

    const uid = randomUUID();
    const passwordHash = await hashPassword(password);

    try {
      await this.prismaService.user.create({
        data: { id: uid, username, email, passwordHash },
      });
    } catch (e: unknown) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException('Email already registered');
      }
      throw e;
    }

    return {
      token: this.signToken(uid, email),
      user: { email, uid, username },
    };
  }

  private async loginPostgresPrisma(
    email: string,
    password: string
  ): Promise<JwtAuthResponseBody> {
    if (!this.prismaService) {
      throw new InternalServerErrorException('PrismaService is not available');
    }

    const row = await this.prismaService.user.findFirst({
      where: { email },
    });

    if (!row?.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const ok = await verifyPassword(password, row.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      token: this.signToken(row.id, row.email ?? email),
      user: {
        email: row.email ?? email,
        uid: row.id,
        username: row.username,
      },
    };
  }

  private async registerInMemory(
    email: string,
    username: string,
    password: string
  ): Promise<JwtAuthResponseBody> {
    if (this.jwtRegistry.findByEmail(email)) {
      throw new ConflictException('Email already registered');
    }

    const uid = randomUUID();
    const passwordHash = await hashPassword(password);
    await this.jwtRegistry.save(uid, username, email, passwordHash);

    return {
      token: this.signToken(uid, email),
      user: { email, uid, username },
    };
  }

  private async loginInMemory(
    email: string,
    password: string
  ): Promise<JwtAuthResponseBody> {
    const row = this.jwtRegistry.findByEmail(email);
    if (!row) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const ok = await verifyPassword(password, row.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      token: this.signToken(row.uid, row.email),
      user: {
        email: row.email,
        uid: row.uid,
        username: row.username,
      },
    };
  }

  private signToken(uid: string, email: string): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new InternalServerErrorException('JWT_SECRET is not configured');
    }

    return sign(
      { user_id: uid, uid, email, sub: uid },
      secret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }
}
