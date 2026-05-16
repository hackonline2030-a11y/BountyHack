/**
 * Bootstrap du premier (ou d’un) compte SUPER_ADMIN en prod — hors seed démo.
 *
 * Le mot de passe n’est jamais lu depuis .env ni écrit sur disque : saisie
 * masquée au clavier (SSH) ou variable d’env éphémère (optionnelle).
 *
 * Usage recommandé (depuis server/) :
 *   pnpm run create-super-admin -- --username "Lead" --email "you@example.com"
 *   → le script demande le mot de passe (2 fois) sans l’afficher.
 *
 * Prérequis : roles seedés, DATABASE_URL dans .env (connexion DB seulement).
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

/** Saisie masquée (TTY SSH). Le mot de passe ne reste que en RAM le temps du script. */
function readHiddenPrompt(prompt) {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY) {
      reject(
        new Error(
          'Terminal interactif requis. Lance depuis SSH (pas de pipe). ' +
            'Ne mets pas le mot de passe dans .env.',
        ),
      );
      return;
    }

    process.stdout.write(prompt);
    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    let value = '';
    const onData = (chunk) => {
      const ch = chunk.toString();
      switch (ch) {
        case '\n':
        case '\r':
        case '\u0004':
          stdin.setRawMode(false);
          stdin.removeListener('data', onData);
          stdin.pause();
          process.stdout.write('\n');
          resolve(value);
          break;
        case '\u0003':
          process.stdout.write('\n');
          process.exit(130);
          break;
        case '\u007f':
        case '\b':
          value = value.slice(0, -1);
          break;
        default:
          if (ch >= ' ') value += ch;
          break;
      }
    };
    stdin.on('data', onData);
  });
}

async function readPasswordInteractive() {
  const a = await readHiddenPrompt('Mot de passe super-admin : ');
  const b = await readHiddenPrompt('Confirmer le mot de passe : ');
  if (a !== b) {
    console.error('Les deux saisies ne correspondent pas.');
    process.exit(1);
  }
  if (!a) {
    console.error('Mot de passe vide.');
    process.exit(1);
  }
  return a;
}

async function resolvePassword() {
  const fromEnv = process.env.SUPER_ADMIN_PASSWORD?.trim();
  if (fromEnv) {
    console.warn(
      '[create-super-admin] SUPER_ADMIN_PASSWORD lu depuis l’environnement (éphémère). ' +
        'Ne pas l’ajouter à .env. Préférer la saisie interactive sans export.',
    );
    return fromEnv;
  }
  return readPasswordInteractive();
}

async function hashPassword(plain) {
  const salt = randomBytes(16).toString('hex');
  const derived = await scryptAsync(plain, salt, KEY_LEN);
  return `${salt}:${derived.toString('hex')}`;
}

function sqlEscape(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "''");
}

async function main() {
  const { username, email } = parseArgs(process.argv.slice(2));

  if (!username || !email) {
    console.error(
      'Usage: pnpm run create-super-admin -- --username "Lead" --email "you@example.com"',
    );
    process.exit(1);
  }
  if (!process.env.DATABASE_URL?.trim()) {
    console.error('DATABASE_URL missing in server/.env');
    process.exit(1);
  }

  const password = await resolvePassword();
  const uid = randomUUID();
  const normalizedEmail = email.trim().toLowerCase();
  const passwordHash = await hashPassword(password);

  const isMysql =
    (process.env.DATABASE_NAME ?? '').trim().toUpperCase() === 'MYSQL_PRISMA';

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
  console.log('  En base : password_hash (scrypt) uniquement — jamais le mot de passe en clair.');
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
