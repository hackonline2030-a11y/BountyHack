import type {
  PasswordHash,
  PasswordHasher,
} from "@modules/auth/domain/services/password-hasher.service";

// Fake hasher for tests. Uses a deterministic reversible transform.
export class FakePasswordHasher implements PasswordHasher {
  async hash(plainPassword: string): Promise<PasswordHash> {
    return `fake-hash:${plainPassword}`;
  }

  async compare(
    plainPassword: string,
    passwordHash: PasswordHash
  ): Promise<boolean> {
    return passwordHash === `fake-hash:${plainPassword}`;
  }
}

