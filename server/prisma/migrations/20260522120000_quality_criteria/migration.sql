-- CreateEnum
CREATE TYPE "QualityCriterionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "quality_criterion_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quality_criterion_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_criterion_target_types" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "requires_target_ref" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quality_criterion_target_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_criteria" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "explanation" TEXT,
    "status" "QualityCriterionStatus" NOT NULL DEFAULT 'DRAFT',
    "category_id" TEXT,
    "created_by_user_id" TEXT NOT NULL,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quality_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_criterion_target_type_links" (
    "criterion_id" TEXT NOT NULL,
    "target_type_id" TEXT NOT NULL,

    CONSTRAINT "quality_criterion_target_type_links_pkey" PRIMARY KEY ("criterion_id","target_type_id")
);

-- CreateTable
CREATE TABLE "quality_criterion_distributions" (
    "id" TEXT NOT NULL,
    "criterion_id" TEXT NOT NULL,
    "target_type_id" TEXT NOT NULL,
    "target_ref_id" TEXT,
    "distributed_by_user_id" TEXT NOT NULL,
    "distributed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quality_criterion_distributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_criterion_checks" (
    "id" TEXT NOT NULL,
    "distribution_id" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "checked_by_user_id" TEXT,
    "checked_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quality_criterion_checks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "quality_criterion_target_types_code_key" ON "quality_criterion_target_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "quality_criteria_code_key" ON "quality_criteria"("code");

-- CreateIndex
CREATE INDEX "quality_criteria_status_idx" ON "quality_criteria"("status");

-- CreateIndex
CREATE INDEX "quality_criteria_created_by_user_id_idx" ON "quality_criteria"("created_by_user_id");

-- CreateIndex
CREATE INDEX "quality_criteria_category_id_idx" ON "quality_criteria"("category_id");

-- CreateIndex
CREATE INDEX "quality_criterion_distributions_criterion_id_idx" ON "quality_criterion_distributions"("criterion_id");

-- CreateIndex
CREATE INDEX "quality_criterion_distributions_target_type_id_target_ref_id_idx" ON "quality_criterion_distributions"("target_type_id", "target_ref_id");

-- CreateIndex
CREATE UNIQUE INDEX "quality_criterion_checks_distribution_id_context_key" ON "quality_criterion_checks"("distribution_id", "context");

-- CreateIndex
CREATE INDEX "quality_criterion_checks_distribution_id_idx" ON "quality_criterion_checks"("distribution_id");

-- One distribution per criterion + target type + scope (NULL ref = global path_course, etc.)
CREATE UNIQUE INDEX "quality_criterion_distributions_scope_unique"
  ON "quality_criterion_distributions" ("criterion_id", "target_type_id", (COALESCE("target_ref_id", '')));

-- AddForeignKey
ALTER TABLE "quality_criteria" ADD CONSTRAINT "quality_criteria_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "quality_criterion_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_criteria" ADD CONSTRAINT "quality_criteria_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_criterion_target_type_links" ADD CONSTRAINT "quality_criterion_target_type_links_criterion_id_fkey" FOREIGN KEY ("criterion_id") REFERENCES "quality_criteria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_criterion_target_type_links" ADD CONSTRAINT "quality_criterion_target_type_links_target_type_id_fkey" FOREIGN KEY ("target_type_id") REFERENCES "quality_criterion_target_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_criterion_distributions" ADD CONSTRAINT "quality_criterion_distributions_criterion_id_fkey" FOREIGN KEY ("criterion_id") REFERENCES "quality_criteria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_criterion_distributions" ADD CONSTRAINT "quality_criterion_distributions_target_type_id_fkey" FOREIGN KEY ("target_type_id") REFERENCES "quality_criterion_target_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_criterion_distributions" ADD CONSTRAINT "quality_criterion_distributions_distributed_by_user_id_fkey" FOREIGN KEY ("distributed_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_criterion_checks" ADD CONSTRAINT "quality_criterion_checks_distribution_id_fkey" FOREIGN KEY ("distribution_id") REFERENCES "quality_criterion_distributions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_criterion_checks" ADD CONSTRAINT "quality_criterion_checks_checked_by_user_id_fkey" FOREIGN KEY ("checked_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed target types (idempotent)
INSERT INTO "quality_criterion_target_types" ("id", "code", "label", "requires_target_ref", "sort_order", "is_active", "created_at", "updated_at")
VALUES
  ('00000000-0000-4000-8000-000000000001', 'report', 'Report draft', true, 10, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('00000000-0000-4000-8000-000000000002', 'path_course', 'Path course', false, 20, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO UPDATE SET
  "label" = EXCLUDED."label",
  "requires_target_ref" = EXCLUDED."requires_target_ref",
  "sort_order" = EXCLUDED."sort_order",
  "is_active" = EXCLUDED."is_active",
  "updated_at" = CURRENT_TIMESTAMP;
