import bcrypt from "bcrypt";
import type {
  PasswordHash,
  PasswordHasher,
} from "@modules/auth/domain/services/password-hasher.service";

// Infra adapter: the domain only needs the `PasswordHasher` contract.
// This implementation delegates to the external `bcrypt` library.
export class BCryptPasswordHasher implements PasswordHasher {
  constructor(private readonly saltRounds = 10) {}

  async hash(plainPassword: string): Promise<PasswordHash> {
    return bcrypt.hash(plainPassword, this.saltRounds);
  }

  async compare(
    plainPassword: string,
    passwordHash: PasswordHash
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, passwordHash);
  }
}

