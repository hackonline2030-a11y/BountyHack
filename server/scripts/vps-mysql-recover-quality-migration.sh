#!/usr/bin/env bash
# Recover failed 20260522120000_quality_criteria on MariaDB/MySQL (prod VPS).
# Run from server/ after git pull (migration must use plain target_ref_scope, not COALESCE).
set -euo pipefail

cd "$(dirname "$0")/.."

if ! grep -q "target_ref_scope.*NOT NULL DEFAULT" prisma/migrations-mysql/20260522120000_quality_criteria/migration.sql; then
  echo "ERROR: migration file still uses COALESCE/generated column. git pull the latest fix first."
  exit 1
fi

export DATABASE_NAME=MYSQL_PRISMA

echo "1/4 Mark failed migration as rolled back..."
pnpm exec prisma migrate resolve --rolled-back 20260522120000_quality_criteria

echo "2/4 Drop partial quality tables (ignore errors if missing)..."
pnpm exec prisma db execute --stdin <<'SQL'
DROP TABLE IF EXISTS quality_criterion_checks;
DROP TABLE IF EXISTS quality_criterion_distributions;
DROP TABLE IF EXISTS quality_criterion_target_type_links;
DROP TABLE IF EXISTS quality_criteria;
DROP TABLE IF EXISTS quality_criterion_target_types;
DROP TABLE IF EXISTS quality_criterion_categories;
SQL

echo "3/4 prisma migrate deploy..."
pnpm exec prisma migrate deploy

echo "4/4 prisma generate (optional if API already built)..."
pnpm exec prisma generate

echo "Done. Optionally: DATABASE_NAME=MYSQL_PRISMA pnpm exec prisma db seed"
