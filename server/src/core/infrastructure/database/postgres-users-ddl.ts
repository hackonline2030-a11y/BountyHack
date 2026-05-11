/**
 * DDL snippets used by {@link PrismaService} `onModuleInit` to ensure legacy DBs match the `users` table.
 * Canonical schema stays in Prisma migrations; prefer `prisma migrate` for greenfield DBs.
 */
export const PG_USERS_TABLE = 'users';

export const CREATE_PG_USERS_TABLE_SQL = `
    CREATE TABLE IF NOT EXISTS ${PG_USERS_TABLE} (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      email TEXT UNIQUE,
      password_hash TEXT,
      two_factor_enabled BIGINT NOT NULL DEFAULT 0
    );
  ` as const;

export const ENSURE_PG_USERS_TWO_FACTOR_COLUMN_SQL = `
    ALTER TABLE ${PG_USERS_TABLE} ADD COLUMN IF NOT EXISTS two_factor_enabled BIGINT NOT NULL DEFAULT 0;
  ` as const;

/** Optional bootstrap for legacy DBs (Prisma migrations remain canonical on greenfield). */
export const CREATE_PG_REFRESH_TOKENS_TABLE_SQL = `
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id TEXT PRIMARY KEY,
      token_hash TEXT NOT NULL UNIQUE,
      user_id TEXT NOT NULL REFERENCES ${PG_USERS_TABLE}(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL,
      last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  ` as const;

export const CREATE_PG_REFRESH_TOKENS_USER_ID_INDEX_SQL = `
    CREATE INDEX IF NOT EXISTS refresh_tokens_user_id_idx ON refresh_tokens(user_id);
  ` as const;
