// NOTE: For now this file intentionally contains all related domain types.
// We'll move value objects/errors/types into their own files later.

import type { PasswordHash } from "@modules/auth/domain/services/password-hasher.service";
import type { PasswordHasher } from "@modules/auth/domain/services/password-hasher.service";

export type Feature = string;

export class UserId {
  private constructor(public readonly value: string) {}

  static create(value: string): UserId {
    const trimmed = value.trim();
    if (!trimmed) {
      throw new Error('UserId cannot be empty');
    }
    return new UserId(trimmed);
  }
}

export class Email {
  private constructor(public readonly value: string) {}

  static create(value: string): Email {
    return new Email(value.trim().toLowerCase());
  }

  isValid(): boolean {
    // Lightweight validation for now; we'll tighten rules later if needed.
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.value);
  }
}

export class UserProfile {
  private constructor(
    public readonly tier: Feature[],
    public readonly name: string
  ) {}

  static create(props: { name: string; tier?: Feature[] }): UserProfile {
    return new UserProfile(props.tier ?? [], props.name);
  }
}

export class UserStatus {
  private constructor(private readonly active: boolean) {}

  static active(): UserStatus {
    return new UserStatus(true);
  }

  static inactive(): UserStatus {
    return new UserStatus(false);
  }

  isActive(): boolean {
    return this.active;
  }
}

export class InvalidEmailError extends Error {
  constructor(email: string) {
    super(`Invalid email: ${email}`);
    this.name = "InvalidEmailError";
  }
}

export class UserAlreadyActiveError extends Error {
  constructor(userId: UserId) {
    super(`User ${userId.value} is already active`);
    this.name = "UserAlreadyActiveError";
  }
}

export type CreateUserProps = {
  // Optional for now so the use case can stay simple; we generate an id if missing.
  id?: UserId;
  email: Email;
  password: PasswordHash;
  profile: UserProfile;
  status?: UserStatus;
};

export class User {
    private constructor(
      public readonly id: UserId,
      public readonly email: Email,
      public readonly profile: UserProfile,
      private status: UserStatus,
      // Stored as a hash only; hashing strategy lives behind `PasswordHasher`.
      private readonly password: PasswordHash
    ) {}
  
    static create(props: CreateUserProps): User {
      const generatedId =
        props.id ??
        UserId.create(
          `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`
        );
      // Validate invariants
      if (!props.email.isValid()) {
        throw new InvalidEmailError(props.email.value);
      }
      return new User(
        generatedId,
        props.email,
        props.profile,
        props.status ?? UserStatus.inactive(),
        props.password
      );
    }
  
    activate(): void {
      if (this.status.isActive()) {
        throw new UserAlreadyActiveError(this.id);
      }
      this.status = UserStatus.active();
    }

    // Domain behavior: verification delegates strategy to the injected hasher.
    async verifyPassword(
      plainPassword: string,
      passwordHasher: PasswordHasher
    ): Promise<boolean> {
      return passwordHasher.compare(plainPassword, this.password);
    }

    // Used by persistence/adapters to store the hash (hashing strategy stays outside).
    getPasswordHash(): PasswordHash {
      return this.password;
    }

    isActive(): boolean {
      return this.status.isActive();
    }
  
    // Domain rule: business logic method
    canAccessFeature(feature: Feature): boolean {
      return this.profile.tier.includes(feature) && this.status.isActive();
    }
  }