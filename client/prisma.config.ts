import "dotenv/config";
import { defineConfig } from "prisma/config";

const provider = process.env["DATABASE_PROVIDER"] ?? "sqlite";
const schema =
  provider === "postgresql"
    ? "prisma/schema.postgres.prisma"
    : "prisma/schema.sqlite.prisma";

export default defineConfig({
  schema,
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
