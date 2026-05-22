/**
 * Runs SQL seeds under `prisma/seed/` (not Prisma Migrate).
 * - Always: roles seed (Postgres or MySQL variant from `DATABASE_NAME`).
 * - Optional: demo seed unless SEED_DEMO_USER=false
 *
 * Usage: `pnpm prisma:seed` or `pnpm exec prisma db seed`
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
config({ path: path.join(root, '.env') });

if (!process.env.DATABASE_URL?.trim()) {
  console.error('DATABASE_URL is required (.env)');
  process.exit(1);
}

const databaseName = (process.env.DATABASE_NAME ?? 'POSTGRESQL_PRISMA')
  .trim()
  .toUpperCase();
const useMysql = databaseName === 'MYSQL_PRISMA';
const rolesFile = useMysql ? 'prisma/seed/roles.mysql.sql' : 'prisma/seed/roles.sql';
const demoFile = useMysql ? 'prisma/seed/demo.mysql.sql' : 'prisma/seed/demo.sql';

function runSeedFile(relativeFromServerRoot) {
  const r = spawnSync(
    'pnpm',
    ['exec', 'prisma', 'db', 'execute', '--file', relativeFromServerRoot],
    { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' },
  );
  if (r.error) {
    console.error(r.error);
    process.exit(1);
  }
  if (r.status !== 0) process.exit(r.status ?? 1);
}

runSeedFile(rolesFile);
const qualityTargetTypesFile = useMysql
  ? 'prisma/seed/quality-target-types.mysql.sql'
  : 'prisma/seed/quality-target-types.sql';
runSeedFile(qualityTargetTypesFile);

if (process.env.SEED_DEMO_USER !== 'false') {
  runSeedFile(demoFile);
} else {
  console.log('[seed] SKIP demo seed (SEED_DEMO_USER=false)');
}

console.log('[seed] done.');
