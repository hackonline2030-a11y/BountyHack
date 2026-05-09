import { forwardRef, Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { variables } from '../shared/variables.config';
import { UserModule } from '../users/user.module';

import { AuthRepository } from './ports/auth.repository';
import { PassportJwtAuthRepository } from './adapters/passport-jwt/passport-jwt-auth.repository';
import { PassportJwtLocalStrategy } from './adapters/passport-jwt/strategies/local/passport-jwt-local.strategy';
import { PassportJwtStrategy } from './adapters/passport-jwt/strategies/passport-jwt.strategy';
import { PassportJwtTokenService } from './adapters/passport-jwt/services/passport-jwt-token.service';
import { InMemoryPassportJwtRepository } from './adapters/passport-jwt/repositories/in-memory/in-memory-passport-jwt.repository';
import { JwtInMemoryRegistry } from './adapters/passport-jwt/repositories/in-memory/jwt-in-memory-registry';
import { MongoPassportJwtRepository } from './adapters/passport-jwt/repositories/mongo/mongo-passport-jwt.repository';
import { PostgrePassportJwtRepository } from './adapters/passport-jwt/repositories/postgre/postgre-passport-jwt.repository';
import { PostgrePrismaPassportJwtRepository } from './adapters/passport-jwt/repositories/postgre/postgre-prisma-passport-jwt.repository';

import { RegisterWithPasswordCommand } from './application/commands/register-with-password.command';
import { LoginWithPasswordCommand } from './application/commands/login-with-password.command';
import { GetUserByUidQuery } from './application/queries/get-user-by-uid.query';
import { GetUserFromTokenQuery } from './application/queries/get-user-from-token.query';

import { PassportJwtAuthController } from './controllers/passport-jwt-auth.controller';
import { TotpSignInDemoController } from './controllers/totp-sign-in-demo.controller';
import { TotpEnrollmentController } from './controllers/totp-enrollment.controller';
import { PassportJwtAuthGuard } from './passport-jwt-auth.guard';
import { TotpSignInDemoService } from './application/demo/totp-sign-in-demo.service';
import { TotpEnrollmentService } from './application/totp-enrollment.service';

const usesPersistedJwtStore =
  variables.database === 'MONGODB' ||
  variables.database === 'POSTGRESQL' ||
  variables.database === 'POSTGRESQL_PRISMA';

const authImports = [
  PassportModule,
  ...(usesPersistedJwtStore
    ? [forwardRef(() => UserModule)]
    : []),
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
  PassportJwtAuthRepository,
  PassportJwtTokenService,
  InMemoryPassportJwtRepository,
  MongoPassportJwtRepository,
  PostgrePassportJwtRepository,
  PostgrePrismaPassportJwtRepository,
  RegisterWithPasswordCommand,
  LoginWithPasswordCommand,
  GetUserByUidQuery,
  GetUserFromTokenQuery,
  JwtInMemoryRegistry,
  PassportJwtLocalStrategy,
  PassportJwtStrategy,
  PassportJwtAuthGuard,
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
