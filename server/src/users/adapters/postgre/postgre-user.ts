/**
 * Postgres persistence for the users bounded context.
 * Not ORM — explicit table shape for the `pg` driver (clean architecture: adapter detail).
 */
export namespace PostgreUser {
  export const TABLE_NAME = 'users';

  /** Row as stored in Postgres (`password_hash` matches Mongo-style naming in the domain). */
  export interface Row {
    id: string;
    username: string;
    email: string | null;
    password_hash: string | null;
  }

  /**
   * Single source of truth for DDL used at runtime (Pool bootstrap in `UserModule`).
   * Keep migrations/backfill scripts aligned with this unless you introduce a migration runner.
   */
  export const CREATE_TABLE_SQL = `
    CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      email TEXT UNIQUE,
      password_hash TEXT
    );
  ` as const;
}
