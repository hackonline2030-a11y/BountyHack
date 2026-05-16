/**
 * Bootstrap du premier (ou d’un) compte SUPER_ADMIN en prod — hors seed démo.
 *
 * Usage (sur le VPS, depuis server/) :
 *   SUPER_ADMIN_PASSWORD='<mot-de-passe>' node scripts/create-super-admin.mjs \
 *     --username "Lead" \
 *     --email "hackonline2030@gmail.com"
 *
 * Prérequis : roles seedés (`pnpm run prisma:seed` avec roles.mysql.sql),
 * `DATABASE_URL` dans `.env`, client Prisma généré.
 */
import { randomBytes, randomUUID, scrypt } from 'node:crypto';
import { promisify } from 'node:util';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';

const scryptAsync = promisify(scrypt);
const KEY_LEN = 64;
const serverRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

config({ path: path.join(serverRoot, '.env') });

function parseArgs(argv) {
  let username;
  let email;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--username' && argv[i + 1]) username = argv[++i];
    else if (argv[i] === '--email' && argv[i + 1]) email = argv[++i];
  }
  return { username, email };
}

async function hashPassword(plain) {
  const salt = randomBytes(16).toString('hex');
  const derived = await scryptAsync(plain, salt, KEY_LEN);
  return `${salt}:${derived.toString('hex')}`;
}

function sqlEscape(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "''");
}

const { username, email } = parseArgs(process.argv.slice(2));
const password = process.env.SUPER_ADMIN_PASSWORD?.trim();

if (!username || !email) {
  console.error(
    'Usage: SUPER_ADMIN_PASSWORD=<mot-de-passe> node scripts/create-super-admin.mjs --username "Lead" --email "you@example.com"',
  );
  process.exit(1);
}
if (!password) {
  console.error('SUPER_ADMIN_PASSWORD is required (do not pass on the shell history if avoidable).');
  process.exit(1);
}
if (!process.env.DATABASE_URL?.trim()) {
  console.error('DATABASE_URL missing in server/.env');
  process.exit(1);
}

const uid = randomUUID();
const normalizedEmail = email.trim().toLowerCase();
const passwordHash = await hashPassword(password);

const isMysql = (process.env.DATABASE_NAME ?? '').trim().toUpperCase() === 'MYSQL_PRISMA';

let sql;
if (isMysql) {
  sql = `-- create-super-admin.mjs (MySQL)
INSERT INTO \`users\` (\`id\`, \`username\`, \`email\`, \`password_hash\`, \`role_id\`, \`two_factor_enabled\`)
VALUES (
  '${sqlEscape(uid)}',
  '${sqlEscape(username.trim())}',
  '${sqlEscape(normalizedEmail)}',
  '${sqlEscape(passwordHash)}',
  (SELECT \`id\` FROM \`roles\` WHERE \`name\` = 'SUPER_ADMIN' LIMIT 1),
  0
)
ON DUPLICATE KEY UPDATE
  \`username\` = VALUES(\`username\`),
  \`password_hash\` = VALUES(\`password_hash\`),
  \`role_id\` = (SELECT \`id\` FROM \`roles\` WHERE \`name\` = 'SUPER_ADMIN' LIMIT 1);
`;
} else {
  sql = `-- create-super-admin.mjs (PostgreSQL)
INSERT INTO "users" ("id", "username", "email", "password_hash", "role_id", "two_factor_enabled")
VALUES (
  '${sqlEscape(uid)}',
  '${sqlEscape(username.trim())}',
  '${sqlEscape(normalizedEmail)}',
  '${sqlEscape(passwordHash)}',
  (SELECT "id" FROM "roles" WHERE "name" = 'SUPER_ADMIN' LIMIT 1),
  0
)
ON CONFLICT ("email") DO UPDATE SET
  "username" = EXCLUDED."username",
  "password_hash" = EXCLUDED."password_hash",
  "role_id" = (SELECT "id" FROM "roles" WHERE "name" = 'SUPER_ADMIN' LIMIT 1);
`;
}

const dir = mkdtempSync(path.join(tmpdir(), 'create-super-admin-'));
const file = path.join(dir, 'bootstrap.sql');
writeFileSync(file, sql, 'utf8');

const r = spawnSync(
  'pnpm',
  ['exec', 'prisma', 'db', 'execute', '--file', file],
  { cwd: serverRoot, stdio: 'inherit', shell: process.platform === 'win32' },
);

rmSync(dir, { recursive: true, force: true });

if (r.status !== 0) {
  process.exit(r.status ?? 1);
}

console.log('[create-super-admin] OK');
console.log(`  email: ${normalizedEmail}`);
console.log(`  username: ${username.trim()}`);
console.log(`  role: SUPER_ADMIN`);
console.log('  Login: POST /api/auth/login then use the app.');
