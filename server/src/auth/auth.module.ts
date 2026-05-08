import { FirebaseAuthGuard } from './firebase-auth.guard';
import { AuthRepository } from './ports/auth.repository';
import { FirebaseAuthRepository } from './adapters/firebase-auth.repository';
import { JwtAuthRepository } from './adapters/jwt-auth.repository';
import { forwardRef, Module } from '@nestjs/common';
import { isFirebaseAuthEnabled } from './config/auth-env';
import { OptionalFirebaseModule } from './adapters/optional-firebase.module';
import { JwtInMemoryRegistry } from './adapters/jwt-in-memory-registry';
import { UserModule } from '../users/user.module';
import { variables } from '../shared/variables.config';
import { PassportModule } from '@nestjs/passport';
import { PassportJwtLocalStrategy } from './adapters/passport-jwt-local.strategy';
import { PassportJwtAuthController } from './controllers/passport-jwt-auth.controller';
import { PassportJwtStrategy } from './adapters/passport-jwt.strategy';
import { PassportJwtAuthGuard } from './passport-jwt-auth.guard';
import { RegisterWithPasswordCommand } from './application/commands/register-with-password.command';
import { LoginWithPasswordCommand } from './application/commands/login-with-password.command';
import { GetUserByUidQuery } from './application/queries/get-user-by-uid.query';
import { GetUserFromTokenQuery } from './application/queries/get-user-from-token.query';

const jwtUserPersistenceImports =
  !isFirebaseAuthEnabled() &&
  (variables.database === 'MONGODB' || variables.database === 'POSTGRESQL')
    ? [forwardRef(() => UserModule)]
    : [];

@Module({
  imports: [
    OptionalFirebaseModule.register(),
    ...(!isFirebaseAuthEnabled() ? [PassportModule] : []),
    ...jwtUserPersistenceImports,
  ],
  controllers: isFirebaseAuthEnabled()
    ? []
    : [PassportJwtAuthController],
  providers: [
    FirebaseAuthGuard,
    {
      provide: AuthRepository,
      useClass: isFirebaseAuthEnabled()
        ? FirebaseAuthRepository
        : JwtAuthRepository,
    },
    FirebaseAuthRepository,
    JwtAuthRepository,
    RegisterWithPasswordCommand,
    LoginWithPasswordCommand,
    GetUserByUidQuery,
    GetUserFromTokenQuery,
    ...(isFirebaseAuthEnabled()
      ? []
      : [
          JwtInMemoryRegistry,
          PassportJwtLocalStrategy,
          PassportJwtStrategy,
          PassportJwtAuthGuard,
        ]),
  ],
  exports: [
    FirebaseAuthGuard,
    AuthRepository,
    ...(isFirebaseAuthEnabled() ? [] : [JwtInMemoryRegistry]),
  ],
})
export class AuthModule {}
