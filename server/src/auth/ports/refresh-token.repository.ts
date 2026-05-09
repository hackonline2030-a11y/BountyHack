/** Persistence for opaque refresh secrets (hash-at-rest); implementations: Prisma, Mongo, in-memory. */
export const REFRESH_TOKEN_REPOSITORY = Symbol('REFRESH_TOKEN_REPOSITORY');

export interface IRefreshTokenRepository {
  /** Stores SHA-256 hash of `rawToken`; never persist the raw value. */
  store(userId: string, rawToken: string, expiresAt: Date): Promise<void>;

  /** Resolves non-expired row, bumps `lastUsedAt`, returns user id for rotation. */
  findValidForRotation(rawToken: string): Promise<{ userId: string } | null>;

  revokeByRawToken(rawToken: string): Promise<void>;
}
