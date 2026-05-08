import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { variables } from '../../../shared/variables.config';
import { Identity } from '../../domain/models/identity';
import { RegisterDto, LoginDto, AuthResponse } from '../../dto/auth-common.dto';
import type { AuthRepository } from '../../ports/auth.repository';
import { PassportJwtTokenService } from './services/passport-jwt-token.service';
import { InMemoryPassportJwtRepository } from './repositories/in-memory/in-memory-passport-jwt.repository';
import { MongoPassportJwtRepository } from './repositories/mongo/mongo-passport-jwt.repository';
import { PostgrePassportJwtRepository } from './repositories/postgre/postgre-passport-jwt.repository';
import { PostgrePrismaPassportJwtRepository } from './repositories/postgre/postgre-prisma-passport-jwt.repository';
import {
  PassportJwtPersistence,
  PassportJwtLoginInput,
  PassportJwtRegisterInput,
} from './repositories/passport-jwt-persistence.repository';

/**
 * Strategy-level Passport JWT auth adapter.
 * DB-specific persistence is delegated to dedicated repositories under
 * `adapters/passport-jwt/repositories/*`.
 */
@Injectable()
export class PassportJwtAuthRepository implements AuthRepository {
  constructor(
    private readonly jwtTokenService: PassportJwtTokenService,
    private readonly inMemoryRepo: InMemoryPassportJwtRepository,
    private readonly mongoRepo: MongoPassportJwtRepository,
    private readonly postgreRepo: PostgrePassportJwtRepository,
    private readonly postgrePrismaRepo: PostgrePrismaPassportJwtRepository,
  ) {}

  async getUserFromToken(token: string): Promise<Identity> {
    return this.jwtTokenService.getUserFromToken(token);
  }

  async getUserByUid(uid: string): Promise<Identity> {
    return this.resolvePersistenceRepository().getUserByUid(uid);
  }

  async register(input: RegisterDto): Promise<AuthResponse> {
    const email = input.email.trim().toLowerCase();

    if (!email || !input.username?.trim() || !input.password) {
      throw new UnauthorizedException('Missing credentials');
    }

    const command: PassportJwtRegisterInput = {
      email,
      username: input.username.trim(),
      password: input.password,
    };
    return this.resolvePersistenceRepository().register(command);
  }

  async login(input: LoginDto): Promise<AuthResponse> {
    const email = input.email.trim().toLowerCase();

    if (!email || !input.password) {
      throw new UnauthorizedException('Missing credentials');
    }

    const command: PassportJwtLoginInput = {
      email,
      password: input.password,
    };
    return this.resolvePersistenceRepository().login(command);
  }

  async logout(userId: string): Promise<void> {
    // JWT is stateless, logout is done client side by deleting the token.
    console.log(`Logout request for user ${userId} (no-op for stateless JWT)`);
  }

  private resolvePersistenceRepository(): PassportJwtPersistence {
    switch (variables.database) {
      case 'MONGODB':
        return this.mongoRepo;
      case 'POSTGRESQL':
        return this.postgreRepo;
      case 'POSTGRESQL_PRISMA':
        return this.postgrePrismaRepo;
      case 'IN-MEMORY':
        return this.inMemoryRepo;
      default:
        throw new InternalServerErrorException(
          `Unsupported DATABASE_NAME for JWT auth: ${variables.database}`,
        );
    }
  }
}
