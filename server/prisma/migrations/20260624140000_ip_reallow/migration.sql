-- Persisted reallow entries (blacklist bypass, independent of whitelist-only mode).
CREATE TABLE "ip_reallow_entries" (
    "id" TEXT NOT NULL,
    "cidr" TEXT NOT NULL,
    "label" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_user_id" TEXT NOT NULL,

    CONSTRAINT "ip_reallow_entries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ip_reallow_entries_cidr_key" ON "ip_reallow_entries"("cidr");
