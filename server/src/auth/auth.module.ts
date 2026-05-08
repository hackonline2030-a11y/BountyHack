import { AuthGuard } from './auth.guard';
import { AuthRepository } from './ports/auth.repository';
import { FirebaseAuthRepository } from './infra/firebase-auth.repository';
import { JwtAuthRepository } from './infra/jwt-auth.repository';
import { forwardRef, Module } from '@nestjs/common';
import { isFirebaseAuthEnabled } from './config/auth-env';
import { OptionalFirebaseModule } from './infra/optional-firebase.module';
import { JwtAuthController } from './controllers/jwt-auth.controller';
import { JwtCredentialsService } from './application/jwt-credentials.service';
import { JwtInMemoryRegistry } from './infra/jwt-in-memory-registry';
import { UserModule } from '../users/user.module';
import { variables } from '../shared/variables.config';

const jwtUserPersistenceImports =
  !isFirebaseAuthEnabled() &&
  (variables.database === 'MONGODB' || variables.database === 'POSTGRESQL')
    ? [forwardRef(() => UserModule)]
    : [];

@Module({
  imports: [OptionalFirebaseModule.register(), ...jwtUserPersistenceImports],
  controllers: isFirebaseAuthEnabled() ? [] : [JwtAuthController],
  providers: [
    AuthGuard,
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
      : [JwtInMemoryRegistry, JwtCredentialsService]),
  ],
  exports: [
    AuthGuard,
    AuthRepository,
    ...(isFirebaseAuthEnabled() ? [] : [JwtInMemoryRegistry]),
  ],
})
export class AuthModule {}
