import type { Email, UserId } from "@modules/auth/domain/entities/user.entity";
  
export class UserAlreadyActiveError extends Error {
  constructor(userId: UserId) {
    super(`User ${userId.value} is already active`);
    this.name = 'UserAlreadyActiveError';
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super("Invalid email or password");
    this.name = "InvalidCredentialsError";
  }
}

export class UserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserError';
  }
}

export class InvalidEmailError extends UserError {
  constructor(email: string) {
    super(`Invalid email: ${email}`);
    this.name = 'InvalidEmailError';
  }
}

export class UserNotFoundError extends UserError {
  constructor(userId: string) {
    super(`User not found: ${userId}`);
    this.name = 'UserNotFoundError';
  }
}

export class UserAlreadyExistsError extends UserError {
  constructor(email: Email) {
    super(`User already exists with email: ${email.value}`);
    this.name = 'UserAlreadyExistsError';
  }
}