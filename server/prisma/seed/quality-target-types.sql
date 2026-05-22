-- Idempotent quality target types (also applied in migration 20260522120000_quality_criteria).
INSERT INTO quality_criterion_target_types (id, code, label, requires_target_ref, sort_order, is_active, created_at, updated_at)
VALUES
  ('00000000-0000-4000-8000-000000000001', 'report', 'Report draft', true, 10, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('00000000-0000-4000-8000-000000000002', 'path_course', 'Path course', false, 20, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (code) DO UPDATE SET
  label = EXCLUDED.label,
  requires_target_ref = EXCLUDED.requires_target_ref,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = CURRENT_TIMESTAMP;
