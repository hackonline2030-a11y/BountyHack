import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';

import { variables } from '../shared/variables.config';
import { UserModule } from '../users/user.module';

import { AuthRepository } from './ports/auth.repository';
import { REFRESH_TOKEN_REPOSITORY } from './ports/refresh-token.repository';
import { PassportJwtAuthRepository } from './adapters/passport-jwt/passport-jwt-auth.repository';
import { PassportJwtLocalStrategy } from './adapters/passport-jwt/strategies/local/passport-jwt-local.strategy';
import { PassportJwtStrategy } from './adapters/passport-jwt/strategies/passport-jwt.strategy';
import { PassportJwtTokenService } from './adapters/passport-jwt/services/passport-jwt-token.service';
import { InMemoryPassportJwtRepository } from './adapters/passport-jwt/repositories/in-memory/in-memory-passport-jwt.repository';
import { JwtInMemoryRegistry } from './adapters/passport-jwt/repositories/in-memory/jwt-in-memory-registry';
import { InMemoryRefreshTokenRepository } from './adapters/passport-jwt/repositories/in-memory/in-memory-refresh-token.repository';
import { MongoPassportJwtRepository } from './adapters/passport-jwt/repositories/mongo/mongo-passport-jwt.repository';
import { MongoRefreshTokenRepository } from './adapters/passport-jwt/repositories/mongo/mongo-refresh-token.repository';
import { MongoRefreshToken } from './adapters/passport-jwt/repositories/mongo/mongo-refresh-token';
import { PostgrePrismaPassportJwtRepository } from './adapters/passport-jwt/repositories/postgre/postgre-prisma-passport-jwt.repository';
import { PrismaRefreshTokenRepository } from './adapters/passport-jwt/repositories/postgre/prisma-refresh-token.repository';

import { RegisterWithPasswordCommand } from './application/commands/register-with-password.command';
import { LogoutSessionCommand } from './application/commands/logout-session.command';
import { LoginWithPasswordCommand } from './application/commands/login-with-password.command';
import { GetUserByUidQuery } from './application/queries/get-user-by-uid.query';
import { GetUserFromTokenQuery } from './application/queries/get-user-from-token.query';
import { RefreshAccessTokenQuery } from './application/queries/get-refresh-access-token.query';

import { PassportJwtAuthController } from './controllers/passport-jwt-auth.controller';
import { TotpSignInDemoController } from './controllers/totp-sign-in-demo.controller';
import { TotpEnrollmentController } from './controllers/totp-enrollment.controller';
import { PassportJwtAuthGuard } from './adapters/passport-jwt/guards/passport-jwt-auth.guard';
import { RolesGuard } from './rbac/roles.guard';
import { TotpSignInDemoService } from './application/demo/totp-sign-in-demo.service';
import { TotpEnrollmentService } from './application/totp-enrollment.service';

const usesPersistedJwtStore =
  variables.database === 'MONGODB' ||
  variables.database === 'POSTGRESQL_PRISMA';

const mongoRefreshImports =
  variables.database === 'MONGODB'
    ? [
        MongooseModule.forFeature([
          {
            name: MongoRefreshToken.CollectionName,
            schema: MongoRefreshToken.Schema,
          },
        ]),
      ]
    : [];

function resolveRefreshTokenRepositoryClass() {
  switch (variables.database) {
    case 'POSTGRESQL_PRISMA':
      return PrismaRefreshTokenRepository;
    case 'MONGODB':
      return MongoRefreshTokenRepository;
    case 'IN-MEMORY':
    default:
      return InMemoryRefreshTokenRepository;
  }
}

const authImports = [
  PassportModule,
  ...(usesPersistedJwtStore ? [forwardRef(() => UserModule)] : []),
  ...mongoRefreshImports,
];

const authControllers = [
  PassportJwtAuthController,
  ...(variables.database === 'POSTGRESQL_PRISMA'
    ? [TotpSignInDemoController, TotpEnrollmentController]
    : []),
];

const prismaTotpProviders =
  variables.database === 'POSTGRESQL_PRISMA'
    ? [TotpSignInDemoService, TotpEnrollmentService]
    : [];

const coreProviders = [
  ...prismaTotpProviders,
  {
    provide: AuthRepository,
    useClass: PassportJwtAuthRepository,
  },
  {
    provide: REFRESH_TOKEN_REPOSITORY,
    useClass: resolveRefreshTokenRepositoryClass(),
  },
  PassportJwtAuthRepository,
  PassportJwtTokenService,
  PrismaRefreshTokenRepository,
  MongoRefreshTokenRepository,
  InMemoryRefreshTokenRepository,
  InMemoryPassportJwtRepository,
  MongoPassportJwtRepository,
  PostgrePrismaPassportJwtRepository,
  RegisterWithPasswordCommand,
  LoginWithPasswordCommand,
  GetUserByUidQuery,
  GetUserFromTokenQuery,
  RefreshAccessTokenQuery,
  LogoutSessionCommand,
  JwtInMemoryRegistry,
  PassportJwtLocalStrategy,
  PassportJwtStrategy,
  PassportJwtAuthGuard,
  RolesGuard,
];

const authExports = [
  AuthRepository,
  JwtInMemoryRegistry,
];

@Module({
  imports: authImports,
  controllers: authControllers,
  providers: coreProviders,
  exports: authExports,
})
export class AuthModule {}
