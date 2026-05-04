import { describe, it, expect } from "@jest/globals";
import { InMemoryUserRepository } from "@modules/auth/infra/repositories/in-memory/in-memory-user.repository";
import { FakeEmailService } from "@modules/auth/infra/services/fake-email.service";
import { FakePasswordHasher } from "@modules/auth/infra/services/fake-password-hasher";
import { RegisterUserUseCase } from "@modules/auth/use-cases/commands/register-user.usecase";

export function createTestAuthModule() {
  const userRepo = new InMemoryUserRepository();
  const emailService = new FakeEmailService();
  const passwordHasher = new FakePasswordHasher();
  const registerUserUseCase = new RegisterUserUseCase(
    userRepo,
    emailService,
    passwordHasher
  );
  return {
    registerUser: registerUserUseCase,
    testHelpers: { userRepo, emailService },
  };
}

describe("createTestAuthModule", () => {
  it("should wire use case with test doubles and allow registration", async () => {
    const { registerUser, testHelpers } = createTestAuthModule();
    const result = await registerUser.execute({
      email: "module@example.com",
      password: "pass123",
      name: "Module User",
    });
    expect(result.success).toBe(true);
    expect(testHelpers.emailService.welcomeEmailsSent).toContain(
      "module@example.com"
    );
  });
});