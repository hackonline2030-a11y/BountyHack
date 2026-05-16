/**
 * Load server/.env before any module reads `process.env` (e.g. `variables.config.ts`).
 * PM2 does not load `.env` automatically; Nest `ConfigModule` runs too late for static imports in `app.module.ts`.
 */
import { config } from 'dotenv';
import { existsSync } from 'fs';
import { join } from 'path';

const envPath = join(process.cwd(), '.env');
if (existsSync(envPath)) {
  config({ path: envPath });
}
