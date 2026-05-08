import { FirebaseAuthGuard } from './firebase-auth.guard';
import { AuthRepository } from './ports/auth.repository';
import { FirebaseAuthRepository } from './infra/firebase-auth.repository';
import { JwtAuthRepository } from './infra/jwt-auth.repository';
import { forwardRef, Module } from '@nestjs/common';
import { isFirebaseAuthEnabled } from './config/auth-env';
import { OptionalFirebaseModule } from './infra/optional-firebase.module';
import { JwtInMemoryRegistry } from './infra/jwt-in-memory-registry';
import { UserModule } from '../users/user.module';
import { variables } from '../shared/variables.config';
import { PassportModule } from '@nestjs/passport';
import { PassportJwtLocalStrategy } from './infra/passport-jwt-local.strategy';
import { PassportJwtAuthController } from './controllers/passport-jwt-auth.controller';
import { PassportJwtStrategy } from './infra/passport-jwt.strategy';
import { PassportJwtAuthGuard } from './passport-jwt-auth.guard';

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
