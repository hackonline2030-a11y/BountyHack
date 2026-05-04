// Domain abstraction: defines the contract for hashing/verifying passwords
// without depending on any external crypto library (bcrypt, argon2, etc).

export type PasswordHash = string;

export interface PasswordHasher {
  hash(plainPassword: string): Promise<PasswordHash>;

  // Used during login/reset flows to avoid leaking hashing strategy details.
  compare(plainPassword: string, passwordHash: PasswordHash): Promise<boolean>;
}
