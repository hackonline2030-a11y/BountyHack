import { FirebaseAuthGuard } from './firebase-auth.guard';
import { forwardRef, Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { variables } from '../shared/variables.config';
import { UserModule } from '../users/user.module';

import { isFirebaseAuthEnabled } from './config/auth-env';
import { AuthRepository } from './ports/auth.repository';

import { FirebaseAuthRepository } from './adapters/firebase-auth/firebase-auth.repository';
import { OptionalFirebaseModule } from './adapters/firebase-auth/optional-firebase.module';
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
import { PassportJwtAuthGuard } from './passport-jwt-auth.guard';

const firebaseEnabled = isFirebaseAuthEnabled();
const passportEnabled = !firebaseEnabled;
const usesPersistedJwtStore =
  variables.database === 'MONGODB' ||
  variables.database === 'POSTGRESQL' ||
  variables.database === 'POSTGRESQL_PRISMA';

const authImports = [
  OptionalFirebaseModule.register(),
  ...(passportEnabled ? [PassportModule] : []),
  ...(passportEnabled && usesPersistedJwtStore
    ? [forwardRef(() => UserModule)]
    : []),
];

const authControllers = passportEnabled ? [PassportJwtAuthController] : [];

const coreProviders = [
  FirebaseAuthGuard,
  {
    provide: AuthRepository,
    useClass: firebaseEnabled
      ? FirebaseAuthRepository
      : PassportJwtAuthRepository,
  },
  FirebaseAuthRepository,
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
];

const passportProviders = passportEnabled
  ? [
      JwtInMemoryRegistry,
      PassportJwtLocalStrategy,
      PassportJwtStrategy,
      PassportJwtAuthGuard,
    ]
  : [];

const authExports = [
  FirebaseAuthGuard,
  AuthRepository,
  ...(passportEnabled ? [JwtInMemoryRegistry] : []),
];

@Module({
  imports: authImports,
  controllers: authControllers,
  providers: [...coreProviders, ...passportProviders],
  exports: authExports,
})
export class AuthModule {}
