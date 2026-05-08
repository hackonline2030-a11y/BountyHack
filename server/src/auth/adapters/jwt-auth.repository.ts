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
import { JwtPayload, verify, sign } from 'jsonwebtoken';
import { MongoUser } from '../../users/adapters/mongo/mongo-user';
import { variables } from '../../shared/variables.config';
import { hashPassword, verifyPassword } from './password.util';
import { JwtInMemoryRegistry } from './jwt-in-memory-registry';
import { Identity } from '../domain/models/identity';
import { RegisterDto, LoginDto, AuthResponse } from '../dto/auth-common.dto';
import type { AuthRepository } from '../ports/auth.repository';
import { randomUUID } from 'crypto';

type SupportedJwtPayload = JwtPayload & {
  uid?: string;
  user_id?: string;
  sub?: string;
  email?: string;
};

/**
 * JWT AuthRepository port implementation
 * Manages authentication via JW with MongoDB or In-Memory storage
 */
@Injectable()
export class JwtAuthRepository implements AuthRepository {
  constructor(
    private readonly jwtRegistry: JwtInMemoryRegistry,
    @Optional()
    @Inject(getModelToken(MongoUser.CollectionName))
    private readonly userModel?: Model<MongoUser.SchemaClass>
  ) {}


  async getUserFromToken(token: string): Promise<Identity> {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new UnauthorizedException('JWT_SECRET is not configured');
    }

    const payload = verify(token, secret) as SupportedJwtPayload;
    const uid = payload.uid || payload.user_id || payload.sub;

    if (!uid) {
      throw new UnauthorizedException('JWT token does not contain a user id');
    }

    return {
      email: payload.email ?? '',
      uid,
    };
  }

  async getUserByUid(uid: string): Promise<Identity> {
    return {
      email: '',
      uid,
    };
  }

  async register(input: RegisterDto): Promise<AuthResponse> {
    const email = input.email.trim().toLowerCase();

    if (!email || !input.username?.trim() || !input.password) {
      throw new UnauthorizedException('Missing credentials');
    }

    if (variables.database === 'MONGODB') {
      return this.registerMongo(email, input.username.trim(), input.password);
    }

    if (variables.database === 'IN-MEMORY') {
      return this.registerInMemory(
        email,
        input.username.trim(),
        input.password,
      );
    }

    throw new InternalServerErrorException(
      'JWT register is only supported with DATABASE_NAME=MONGODB or IN-MEMORY',
    );
  }

  async login(input: LoginDto): Promise<AuthResponse> {
    const email = input.email.trim().toLowerCase();

    if (!email || !input.password) {
      throw new UnauthorizedException('Missing credentials');
    }

    if (variables.database === 'MONGODB') {
      return this.loginMongo(email, input.password);
    }

    if (variables.database === 'IN-MEMORY') {
      return this.loginInMemory(email, input.password);
    }

    throw new InternalServerErrorException(
      'JWT login is only supported with DATABASE_NAME=MONGODB or IN-MEMORY',
    );

  }

  async logout(userId: string): Promise<void> {
    // JWT is stateless, logout is done client side by deleting the token.
    console.log(`Logout request for user ${userId} (no-op for stateless JWT)`);
  }

  // === Private Methods (MongoDB) ===

  private async registerMongo(
    email: string,
    username: string,
    password: string,
  ): Promise<AuthResponse> {
    if (!this.userModel) {
      throw new InternalServerErrorException(
        'Mongo user model is not available',
      );
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
    } catch (error: unknown) {
      const code = (error as { code?: number })?.code;
      if (code === 11000) {
        throw new ConflictException('Email already registered');
      }
      throw error;
    }

    return {
      token: this.signToken(uid, email),
      user: { email, uid, username },
      require2FA: false,
    };
  }

  private async loginMongo(
    email: string,
    password: string,
  ): Promise<AuthResponse> {
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
      require2FA: false,
    };
  }

  // Private Methods (In-Memory)

  private async registerInMemory(
    email: string,
    username: string,
    password: string,
  ): Promise<AuthResponse> {
    if (this.jwtRegistry.findByEmail(email)) {
      throw new ConflictException('Email already registered');
    }

    const uid = randomUUID();
    const passwordHash = await hashPassword(password);
    await this.jwtRegistry.save(uid, username, email, passwordHash);

    return {
      token: this.signToken(uid, email),
      user: { email, uid, username },
      require2FA: false,
    };
  }

  private async loginInMemory(
    email: string,
    password: string,
  ): Promise<AuthResponse> {
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

  // === JWT Utils ===

  private signToken(uid: string, email: string): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new InternalServerErrorException('JWT_SECRET is not configured');
    }

    return sign(
      { user_id: uid, email, sub: uid },
      secret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
    );
  }
}
