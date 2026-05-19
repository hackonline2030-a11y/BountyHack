import { PrismaMariaDb } from '@prisma/adapter-mariadb';

/**
 * Builds a Prisma MariaDB adapter from `DATABASE_URL`.
 * Ensures `allowPublicKeyRetrieval` for MySQL 8 / MariaDB `caching_sha2_password` in local dev.
 */
export function createMysqlPrismaAdapter(databaseUrl: string): PrismaMariaDb {
  try {
    const parsed = new URL(databaseUrl);
    let allowPublicKeyRetrieval = true;
    const allowPublicKey = parsed.searchParams.get('allowPublicKeyRetrieval');
    if (allowPublicKey !== null) {
      allowPublicKeyRetrieval = allowPublicKey === 'true';
    }

    return new PrismaMariaDb({
      host: parsed.hostname,
      port: parsed.port ? Number.parseInt(parsed.port, 10) : 3306,
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.replace(/^\//, '') || undefined,
      allowPublicKeyRetrieval,
      connectionLimit: 10,
    });
  } catch {
    const separator = databaseUrl.includes('?') ? '&' : '?';
    const url = databaseUrl.includes('allowPublicKeyRetrieval')
      ? databaseUrl
      : `${databaseUrl}${separator}allowPublicKeyRetrieval=true`;
    return new PrismaMariaDb(url);
  }
}
