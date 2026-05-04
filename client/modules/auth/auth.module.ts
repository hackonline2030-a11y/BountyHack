import { PrismaClient } from '@/generated/prisma/client';

import { RegisterUserUseCase } from './use-cases/commands/register-user.usecase';
import { PrismaUserRepository } from './infra/repositories/prisma/prisma-user.reposirory';
import { ResendEmailService } from './infra/services/resend-email.service';
import { BCryptPasswordHasher } from '@modules/auth/infra/services/bcrypt-password-hasher';
import { LoginUseCase } from './use-cases/commands/login-user.usecase';

export function createAuthModule(config: {
  prisma: PrismaClient;
  resendApiKey: string;
}) {
  // Infrastructure implementations
  const userRepo = new PrismaUserRepository(config.prisma);
  const passwordHasher = new BCryptPasswordHasher();
  const emailService = new ResendEmailService(config.resendApiKey);

  // Use cases
  const registerUserUseCase = new RegisterUserUseCase(
    userRepo,
    emailService,
    passwordHasher
  );

  const loginUseCase = new LoginUseCase(userRepo, passwordHasher);

  // Return use cases (public API)
  return {
    registerUser: registerUserUseCase,
    login: loginUseCase,
  };
}