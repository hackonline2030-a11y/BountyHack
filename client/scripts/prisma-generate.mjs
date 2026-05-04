// Prisma CLI via pnpm exec (not npm/npx).
import { config as loadEnv } from "dotenv";
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
loadEnv({ path: join(root, ".env") });
loadEnv({ path: join(root, ".env.local"), override: true });

const provider = process.env.DATABASE_PROVIDER ?? "sqlite";
const schema =
  provider === "postgresql"
    ? join(root, "prisma/schema.postgres.prisma")
    : join(root, "prisma/schema.sqlite.prisma");

execSync(`pnpm exec prisma generate --schema "${schema}"`, {
  stdio: "inherit",
  cwd: root,
  env: process.env,
});
