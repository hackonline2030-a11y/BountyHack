#!/usr/bin/env bash
# Repair dev MySQL/MariaDB when quality_criterion_distributions was created with the
# legacy COALESCE unique (no target_ref_scope) and 20260524120000 failed with 1054.
#
# Safe for DBs that already match prod (plain target_ref_scope): mostly no-ops.
# Does not drop quality data.
#
# Usage (from server/, DATABASE_URL → local Docker MySQL):
#   DATABASE_NAME=MYSQL_PRISMA ./scripts/dev-mysql-repair-quality-distributions.sh
set -euo pipefail

cd "$(dirname "$0")/.."
export DATABASE_NAME=MYSQL_PRISMA

echo "1/4 Mark failed migration as rolled back (ignore error if not failed)..."
pnpm exec prisma migrate resolve --rolled-back 20260524120000_quality_target_ref_scope_plain 2>/dev/null || true

echo "2/4 Align quality_criterion_distributions with current schema..."
pnpm exec prisma db execute --stdin <<'SQL'
SET @db := DATABASE();

SET @has_col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME = 'quality_criterion_distributions'
    AND COLUMN_NAME = 'target_ref_scope'
);

SET @add_col := IF(
  @has_col = 0,
  'ALTER TABLE `quality_criterion_distributions` ADD COLUMN `target_ref_scope` VARCHAR(191) NOT NULL DEFAULT '''' AFTER `target_ref_id`',
  'SELECT ''target_ref_scope already present'' AS info'
);
PREPARE s1 FROM @add_col;
EXECUTE s1;
DEALLOCATE PREPARE s1;

UPDATE `quality_criterion_distributions`
SET `target_ref_scope` = IFNULL(`target_ref_id`, '')
WHERE `target_ref_scope` = '' OR (`target_ref_id` IS NOT NULL AND `target_ref_scope` <> IFNULL(`target_ref_id`, ''));

SET @has_idx := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME = 'quality_criterion_distributions'
    AND INDEX_NAME = 'quality_criterion_distributions_scope_unique'
);

SET @drop_idx := IF(
  @has_idx > 0,
  'ALTER TABLE `quality_criterion_distributions` DROP INDEX `quality_criterion_distributions_scope_unique`',
  'SELECT ''scope unique index absent'' AS info'
);
PREPARE s2 FROM @drop_idx;
EXECUTE s2;
DEALLOCATE PREPARE s2;

ALTER TABLE `quality_criterion_distributions`
  ADD UNIQUE INDEX `quality_criterion_distributions_scope_unique`(
    `criterion_id`,
    `target_type_id`,
    `target_ref_scope`
  );

ALTER TABLE `quality_criterion_distributions`
  MODIFY `target_ref_scope` VARCHAR(191) NOT NULL DEFAULT '';
SQL

echo "3/4 Mark 20260524120000 as applied (SQL above supersedes the failed run)..."
pnpm exec prisma migrate resolve --applied 20260524120000_quality_target_ref_scope_plain

echo "4/4 prisma migrate deploy (remaining migrations, if any)..."
pnpm exec prisma migrate deploy

echo "Done. Run: DATABASE_NAME=MYSQL_PRISMA pnpm exec prisma generate"
