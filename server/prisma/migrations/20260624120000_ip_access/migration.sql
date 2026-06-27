-- CreateTable
CREATE TABLE "ip_access_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "ip_whitelist_enabled" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by_user_id" TEXT,

    CONSTRAINT "ip_access_settings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "ip_access_settings" ("id", "ip_whitelist_enabled", "updated_at")
VALUES (1, false, CURRENT_TIMESTAMP);

-- CreateTable
CREATE TABLE "ip_whitelist_entries" (
    "id" TEXT NOT NULL,
    "cidr" TEXT NOT NULL,
    "label" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_user_id" TEXT NOT NULL,

    CONSTRAINT "ip_whitelist_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ip_whitelist_entries_cidr_key" ON "ip_whitelist_entries"("cidr");
