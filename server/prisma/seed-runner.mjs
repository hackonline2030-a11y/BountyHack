/**
 * Runs SQL seeds under `prisma/seed/` (not Prisma Migrate).
 * - Always: `roles.sql` (RBAC reference rows).
 * - Optional: `demo.sql` unless SEED_DEMO_USER=false
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

runSeedFile('prisma/seed/roles.sql');

if (process.env.SEED_DEMO_USER !== 'false') {
  runSeedFile('prisma/seed/demo.sql');
} else {
  console.log('[seed] SKIP demo.sql (SEED_DEMO_USER=false)');
}

console.log('[seed] done.');
