import { describe, it, expect, beforeEach } from "@jest/globals";
import { RegisterUserUseCase } from "./register-user.usecase";
import { InMemoryUserRepository } from "@modules/auth/infra/repositories/in-memory/in-memory-user.repository";
import { FakeEmailService } from "@modules/auth/infra/services/fake-email.service";
import { FakePasswordHasher } from "@modules/auth/infra/services/fake-password-hasher";
import { UserAlreadyExistsError } from "@modules/auth/domain/errors/errors.entity";
import { UserId } from "@modules/auth/domain/entities/user.entity";

describe("RegisterUserUseCase", () => {
  let userRepo: InMemoryUserRepository;
  let emailService: FakeEmailService;
  let passwordHasher: FakePasswordHasher;
  let useCase: RegisterUserUseCase;

  beforeEach(() => {
    userRepo = new InMemoryUserRepository();
    emailService = new FakeEmailService();
    passwordHasher = new FakePasswordHasher();
    useCase = new RegisterUserUseCase(userRepo, emailService, passwordHasher);
  });

  it("should register a new user", async () => {
    const result = await useCase.execute({
      email: "test@example.com",
      password: "password123",
      name: "Test User",
    });

    expect(result.success).toBe(true);
    expect(result.userId).toBeDefined();

    const user = await userRepo.findById(UserId.create(result.userId));
    expect(user).not.toBeNull();
    expect(user!.email.value).toBe("test@example.com");
    expect(user!.profile.name).toBe("Test User");
  });

  it("should throw UserAlreadyExistsError when email already exists", async () => {
    await useCase.execute({
      email: "existing@example.com",
      password: "password123",
      name: "First User",
    });

    await expect(
      useCase.execute({
        email: "existing@example.com",
        password: "other456",
        name: "Second User",
      })
    ).rejects.toThrow(UserAlreadyExistsError);
  });

  it("should send welcome email after registration", async () => {
    await useCase.execute({
      email: "welcome@example.com",
      password: "password123",
      name: "Welcome User",
    });

    expect(emailService.welcomeEmailsSent).toContain("welcome@example.com");
  });

  it("should persist user with hashed password", async () => {
    const result = await useCase.execute({
      email: "hash@example.com",
      password: "plainPassword",
      name: "Hash User",
    });

    const user = await userRepo.findById(UserId.create(result.userId));
    expect(user).not.toBeNull();
    // FakePasswordHasher produces "fake-hash:plainPassword"
    expect(user!.getPasswordHash()).toBe("fake-hash:plainPassword");
  });
});
