/** Postgres + Prisma persistence for admin-issued password setup / reset tokens (opaque token, hash at rest). */
export const PASSWORD_RESET_REPOSITORY = Symbol('PASSWORD_RESET_REPOSITORY');

export type PasswordResetAccountSnapshot = {
  userId: string;
  username: string;
  email: string;
};

export interface IPasswordResetRepository {
  /** Accounts that can reset password locally (must have a stored password hash). */
  findPasswordAccountByEmail(
    email: string,
  ): Promise<PasswordResetAccountSnapshot | null>;

  /** Any account with email (with or without password) — invitation / setup link. */
  findAccountByEmailForPasswordSetup(
    email: string,
  ): Promise<PasswordResetAccountSnapshot | null>;

  /** Drops any previous pending token for this user, then stores the new hash and expiry. */
  savePendingResetToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void>;

  /**
   * Validates raw token, removes all pending reset rows for that user, updates password hash,
   * and revokes every persisted refresh session for that user.
   */
  consumePendingTokenAndApplyNewPassword(
    rawToken: string,
    newPasswordHash: string,
  ): Promise<void>;
}
