import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';

import { DATABASE_MODES, isPrismaSqlMode } from '../shared/database-mode';
import { variables } from '../shared/variables.config';
import { UserModule } from '../users/user.module';

import { AuthRepository } from './ports/auth.repository';
import { REFRESH_TOKEN_REPOSITORY } from './ports/refresh-token.repository';
import { PASSWORD_RESET_REPOSITORY } from './ports/password-reset.repository';
import { TRANSACTIONAL_MAIL_PORT } from './ports/transactional-mail.port';
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
import { PrismaPasswordResetRepository } from './adapters/postgre/prisma-password-reset.repository';
import { createTransactionalMailPort } from './adapters/transactional-mail/transactional-mail.factory';

import { RegisterWithPasswordCommand } from './application/commands/register-with-password.command';
import { RegisterUserByAdminCommand } from './application/commands/register-user-by-admin.command';
import { IssuePasswordSetupTokenService } from './application/services/issue-password-setup-token.service';
import { ResendUserInvitationCommand } from './application/commands/resend-user-invitation.command';
import { AdminForcePasswordResetCommand } from './application/commands/admin-force-password-reset.command';
import { LogoutSessionCommand } from './application/commands/logout-session.command';
import { CompletePasswordResetCommand } from './application/commands/complete-password-reset.command';
import { LoginWithPasswordCommand } from './application/commands/login-with-password.command';
import { GetUserByUidQuery } from './application/queries/get-user-by-uid.query';
import { GetUserFromTokenQuery } from './application/queries/get-user-from-token.query';
import { RefreshAccessTokenQuery } from './application/queries/get-refresh-access-token.query';

import { PassportJwtAuthController } from './controllers/passport-jwt-auth.controller';
import { PasswordResetController } from './controllers/password-reset.controller';
import { TotpEnrollmentController } from './controllers/totp-enrollment.controller';
import { PassportJwtAuthGuard } from './adapters/passport-jwt/guards/passport-jwt-auth.guard';
import { RolesGuard } from './rbac/roles.guard';
import { TotpEnrollmentService } from './application/totp-enrollment.service';
import { ProfileStepUpTokenService } from './application/profile-step-up-token.service';

const usesPersistedJwtStore =
  variables.database === DATABASE_MODES.MONGODB || isPrismaSqlMode();

const mongoRefreshImports =
  variables.database === DATABASE_MODES.MONGODB
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
    case DATABASE_MODES.POSTGRESQL_PRISMA:
    case DATABASE_MODES.MYSQL_PRISMA:
      return PrismaRefreshTokenRepository;
    case DATABASE_MODES.MONGODB:
      return MongoRefreshTokenRepository;
    case DATABASE_MODES.IN_MEMORY:
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
  ...(isPrismaSqlMode()
    ? [TotpEnrollmentController, PasswordResetController]
    : []),
];

const prismaTotpProviders = isPrismaSqlMode() ? [TotpEnrollmentService] : [];

const prismaPasswordResetProviders = isPrismaSqlMode()
    ? [
        PrismaPasswordResetRepository,
        {
          provide: PASSWORD_RESET_REPOSITORY,
          useExisting: PrismaPasswordResetRepository,
        },
        {
          provide: TRANSACTIONAL_MAIL_PORT,
          useFactory: () => createTransactionalMailPort(),
        },
        CompletePasswordResetCommand,
        IssuePasswordSetupTokenService,
      ]
    : [];

const coreProviders = [
  ...prismaTotpProviders,
  ...prismaPasswordResetProviders,
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
  RegisterUserByAdminCommand,
  ResendUserInvitationCommand,
  AdminForcePasswordResetCommand,
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
  ProfileStepUpTokenService,
];

const authExports = [
  AuthRepository,
  JwtInMemoryRegistry,
  /** For `@Auth()` / `PassportJwtAuthGuard` on feature modules (e.g. async PDF enqueue). */
  PassportJwtAuthGuard,
  ProfileStepUpTokenService,
  REFRESH_TOKEN_REPOSITORY,
  ...(isPrismaSqlMode()
    ? [
        TotpEnrollmentService,
        ResendUserInvitationCommand,
        AdminForcePasswordResetCommand,
      ]
    : []),
];

@Module({
  imports: authImports,
  controllers: authControllers,
  providers: coreProviders,
  exports: authExports,
})
export class AuthModule {}
