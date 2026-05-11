-- CreateEnum — `APP`: authenticator TOTP per article naming; extend + add WEBAUTHN table later if needed.
DO $$
BEGIN
  CREATE TYPE "TwoFactorMethod" AS ENUM ('APP');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

-- AlterTable (idempotent vs raw `pg` bootstrap)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "two_factor_enabled" BIGINT NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE IF NOT EXISTS "two_factor" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "method" "TwoFactorMethod" NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "two_factor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "two_factor_totp" (
    "id" TEXT NOT NULL,
    "two_factor_id" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "two_factor_totp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "two_factor_user_id_method_key" ON "two_factor"("user_id", "method");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "two_factor_user_id_idx" ON "two_factor"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "two_factor_totp_two_factor_id_key" ON "two_factor_totp"("two_factor_id");

-- AddForeignKey
DO $$
BEGIN
  ALTER TABLE "two_factor" ADD CONSTRAINT "two_factor_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  ALTER TABLE "two_factor_totp" ADD CONSTRAINT "two_factor_totp_two_factor_id_fkey"
    FOREIGN KEY ("two_factor_id") REFERENCES "two_factor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;
