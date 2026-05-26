import {
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { variables } from '../../../shared/variables.config';
import type {
  AuthenticatedSession,
  AuthenticatedUserProfile,
} from '../../application/models/authenticated-session';
import type { LoginWithPasswordInput } from '../../application/models/login-with-password.input';
import type { RegisterWithPasswordInput } from '../../application/models/register-with-password.input';
import { Identity } from '../../domain/models/identity';
import type { AuthRepository } from '../../ports/auth.repository';
import {
  REFRESH_TOKEN_REPOSITORY,
  type IRefreshTokenRepository,
} from '../../ports/refresh-token.repository';
import { attachOpaqueRefreshToSession } from '../utils/opaque-refresh-token.util';
import { PassportJwtTokenService } from './services/passport-jwt-token.service';
import { InMemoryPassportJwtRepository } from './repositories/in-memory/in-memory-passport-jwt.repository';
import { MongoPassportJwtRepository } from './repositories/mongo/mongo-passport-jwt.repository';
import { PostgrePrismaPassportJwtRepository } from './repositories/postgre/postgre-prisma-passport-jwt.repository';
import {
  PassportJwtPersistence,
  PassportJwtLoginInput,
  PassportJwtRegisterInput,
  PassportJwtRegisterPendingInput,
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
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly inMemoryRepo: InMemoryPassportJwtRepository,
    private readonly mongoRepo: MongoPassportJwtRepository,
    private readonly postgrePrismaRepo: PostgrePrismaPassportJwtRepository,
  ) {}

  async getUserFromToken(token: string): Promise<Identity> {
    return this.jwtTokenService.getUserFromToken(token);
  }

  async getUserByUid(uid: string): Promise<Identity> {
    return this.resolvePersistenceRepository().getUserByUid(uid);
  }

  async register(input: RegisterWithPasswordInput): Promise<AuthenticatedSession> {
    const email = input.email.trim().toLowerCase();

    if (!email || !input.username?.trim() || !input.password) {
      throw new UnauthorizedException('Missing credentials');
    }

    const command: PassportJwtRegisterInput = {
      email,
      username: input.username.trim(),
      password: input.password,
      roleCode: input.roleCode,
    };
    const session =
      await this.resolvePersistenceRepository().register(command);
    return attachOpaqueRefreshToSession(this.refreshTokenRepository, session);
  }

  async registerPendingActivation(
    input: PassportJwtRegisterPendingInput,
  ): Promise<AuthenticatedUserProfile> {
    return this.resolvePersistenceRepository().registerPendingActivation(input);
  }

  async login(input: LoginWithPasswordInput): Promise<AuthenticatedSession> {
    const email = input.email.trim().toLowerCase();

    if (!email || !input.password) {
      throw new UnauthorizedException('Missing credentials');
    }

    const command: PassportJwtLoginInput = {
      email,
      password: input.password,
      code: input.code?.trim() || undefined,
    };
    const session = await this.resolvePersistenceRepository().login(command);
    return attachOpaqueRefreshToSession(this.refreshTokenRepository, session);
  }

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<AuthenticatedSession> {
    const trimmed = refreshToken.trim();
    if (!trimmed) {
      throw new UnauthorizedException('Missing refresh token');
    }

    const hit = await this.refreshTokenRepository.findValidForRotation(trimmed);
    if (!hit) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.refreshTokenRepository.revokeByRawToken(trimmed);

    const user = await this.resolvePersistenceRepository().getAuthUserPublicProfile(
      hit.userId,
    );
    const accessToken = this.jwtTokenService.signToken(user.uid, user.email);
    const session: AuthenticatedSession = {
      token: accessToken,
      user,
      require2FA: false,
    };
    return attachOpaqueRefreshToSession(this.refreshTokenRepository, session);
  }

  async logout(userId: string): Promise<void> {
    // JWT is stateless, logout is done client side by deleting the token.
    console.log(`Logout request for user ${userId} (no-op for stateless JWT)`);
  }

  private resolvePersistenceRepository(): PassportJwtPersistence {
    switch (variables.database) {
      case 'MONGODB':
        return this.mongoRepo;
      case 'POSTGRESQL_PRISMA':
      case 'MYSQL_PRISMA':
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
