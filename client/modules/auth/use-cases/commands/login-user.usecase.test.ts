import { describe, it, expect, beforeEach } from "@jest/globals";
import { LoginUseCase } from "./login-user.usecase";
import { RegisterUserUseCase } from "./register-user.usecase";
import { InMemoryUserRepository } from "@modules/auth/infra/repositories/in-memory/in-memory-user.repository";
import { FakeEmailService } from "@modules/auth/infra/services/fake-email.service";
import { FakePasswordHasher } from "@modules/auth/infra/services/fake-password-hasher";
import { InvalidCredentialsError } from "@modules/auth/domain/errors/errors.entity";
import {
  Email,
  User,
  UserId,
  UserProfile,
  UserStatus,
} from "@modules/auth/domain/entities/user.entity";

describe("LoginUseCase", () => {
  let userRepo: InMemoryUserRepository;
  let passwordHasher: FakePasswordHasher;
  let useCase: LoginUseCase;

  beforeEach(() => {
    userRepo = new InMemoryUserRepository();
    passwordHasher = new FakePasswordHasher();
    useCase = new LoginUseCase(userRepo, passwordHasher);
  });

  it("should login when credentials are valid", async () => {
    // Seed user via register (uses same FakePasswordHasher)
    const registerUseCase = new RegisterUserUseCase(
      userRepo,
      new FakeEmailService(),
      passwordHasher
    );
    const registerResult = await registerUseCase.execute({
      email: "valid@example.com",
      password: "secret123",
      name: "Valid User",
    });

    const result = await useCase.execute({
      email: "valid@example.com",
      password: "secret123",
    });

    expect(result.success).toBe(true);
    expect(result.userId).toBe(registerResult.userId);
  });

  it("should throw InvalidCredentialsError when user not found", async () => {
    await expect(
      useCase.execute({
        email: "unknown@example.com",
        password: "anypassword",
      })
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it("should throw InvalidCredentialsError when password is wrong", async () => {
    // Seed user with known password
    const hashedPassword = await passwordHasher.hash("correctPassword");
    const user = User.create({
      id: UserId.create("user-1"),
      email: Email.create("wrongpass@example.com"),
      password: hashedPassword,
      profile: UserProfile.create({ name: "Wrong Pass User" }),
      status: UserStatus.active(),
    });
    await userRepo.save(user);

    await expect(
      useCase.execute({
        email: "wrongpass@example.com",
        password: "wrongPassword",
      })
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it("should return userId on successful login", async () => {
    const hashedPassword = await passwordHasher.hash("mypassword");
    const user = User.create({
      id: UserId.create("login-user-1"),
      email: Email.create("login@example.com"),
      password: hashedPassword,
      profile: UserProfile.create({ name: "Login User" }),
      status: UserStatus.active(),
    });
    await userRepo.save(user);

    const result = await useCase.execute({
      email: "login@example.com",
      password: "mypassword",
    });

    expect(result.userId).toBe("login-user-1");
    expect(result.success).toBe(true);
  });
});
