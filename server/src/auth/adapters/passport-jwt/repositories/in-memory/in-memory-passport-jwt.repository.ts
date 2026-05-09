import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { JwtInMemoryRegistry } from './jwt-in-memory-registry';
import type {
  AuthenticatedSession,
  AuthenticatedUserProfile,
} from '../../../../application/models/authenticated-session';
import { Identity } from '../../../../domain/models/identity';
import { verifyPassword, hashPassword } from '../../../utils/password.util';
import { PassportJwtTokenService } from '../../services/passport-jwt-token.service';
import {
  PassportJwtLoginInput,
  PassportJwtPersistence,
  PassportJwtRegisterInput,
} from '../passport-jwt-persistence.repository';

@Injectable()
export class InMemoryPassportJwtRepository
  implements PassportJwtPersistence
{
  constructor(
    private readonly jwtRegistry: JwtInMemoryRegistry,
    private readonly jwtTokenService: PassportJwtTokenService,
  ) {}

  async getUserByUid(uid: string): Promise<Identity> {
    const row = this.jwtRegistry.findByUid(uid);
    if (!row) {
      throw new UnauthorizedException('User not found');
    }
    return { uid: row.uid, email: '' };
  }

  async getAuthUserPublicProfile(uid: string): Promise<AuthenticatedUserProfile> {
    const row = this.jwtRegistry.findAuthProfileByUid(uid);
    if (!row) {
      throw new UnauthorizedException('User not found');
    }
    return row;
  }

  async register(input: PassportJwtRegisterInput): Promise<AuthenticatedSession> {
    const email = input.email.trim().toLowerCase();
    const username = input.username.trim();
    if (this.jwtRegistry.findByEmail(email)) {
      throw new ConflictException('Email already registered');
    }

    const uid = randomUUID();
    const passwordHash = await hashPassword(input.password);
    await this.jwtRegistry.save(uid, username, email, passwordHash);

    return {
      token: this.jwtTokenService.signToken(uid, email),
      user: { email, uid, username },
      require2FA: false,
    };
  }

  async login(input: PassportJwtLoginInput): Promise<AuthenticatedSession> {
    const email = input.email.trim().toLowerCase();
    const row = this.jwtRegistry.findByEmail(email);
    if (!row) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const ok = await verifyPassword(input.password, row.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      token: this.jwtTokenService.signToken(row.uid, row.email),
      user: {
        email: row.email,
        uid: row.uid,
        username: row.username,
      },
      require2FA: false,
    };
  }
}
