import { variables } from './variables.config';

/** Values for `DATABASE_NAME` (case-insensitive in env; normalized to upper case in `variables`). */
export const DATABASE_MODES = {
  POSTGRESQL_PRISMA: 'POSTGRESQL_PRISMA',
  MYSQL_PRISMA: 'MYSQL_PRISMA',
  MONGODB: 'MONGODB',
  IN_MEMORY: 'IN-MEMORY',
} as const;

/** Nest + Prisma SQL backends (PostgreSQL or MySQL). */
export function isPrismaSqlMode(): boolean {
  return (
    variables.database === DATABASE_MODES.POSTGRESQL_PRISMA ||
    variables.database === DATABASE_MODES.MYSQL_PRISMA
  );
}

export function isPostgresqlPrismaMode(): boolean {
  return variables.database === DATABASE_MODES.POSTGRESQL_PRISMA;
}

export function isMysqlPrismaMode(): boolean {
  return variables.database === DATABASE_MODES.MYSQL_PRISMA;
}
