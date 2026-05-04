import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { Pool } from "pg";

const provider = process.env.DATABASE_PROVIDER ?? "sqlite";
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is required (e.g. file:./prisma/dev.db for SQLite).",
  );
}

const prisma =
  provider === "postgresql"
    ? new PrismaClient({
        adapter: new PrismaPg(new Pool({ connectionString: databaseUrl })),
      })
    : new PrismaClient({
        adapter: new PrismaBetterSqlite3({ url: databaseUrl }),
      });

export { prisma };
