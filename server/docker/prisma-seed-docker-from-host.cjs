/**
 * Comme prisma-migrate-docker-from-host.cjs : exécute `prisma db seed` avec DATABASE_URL réécrite
 * vers localhost (pour joindre Postgres exposé du conteneur).
 */
const { spawn } = require('child_process');
const path = require('path');

require('dotenv').config({
  path: path.join(__dirname, '..', '.env'),
});

const raw = process.env.DATABASE_URL?.trim();
if (!raw) {
  console.error('DATABASE_URL manquant dans server/.env');
  process.exit(1);
}

let connectUrl;
try {
  connectUrl = new URL(raw);
} catch {
  console.error('DATABASE_URL invalide (URL PostgreSQL attendue).');
  process.exit(1);
}

const hostPort = process.env.POSTGRES_HOST_PORT?.trim() || '5432';
connectUrl.hostname = '127.0.0.1';
connectUrl.port = hostPort;

const dbUrl = connectUrl.toString();

const child = spawn('pnpm', ['exec', 'prisma', 'db', 'seed'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    DATABASE_URL: dbUrl,
  },
  shell: process.platform === 'win32',
  cwd: path.join(__dirname, '..'),
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.exit(1);
  }
  process.exit(code ?? 0);
});
