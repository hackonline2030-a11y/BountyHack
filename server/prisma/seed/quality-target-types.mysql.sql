INSERT INTO quality_criterion_target_types (id, code, label, requires_target_ref, sort_order, is_active, created_at, updated_at)
VALUES
  ('00000000-0000-4000-8000-000000000001', 'report', 'Report draft', 1, 10, 1, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('00000000-0000-4000-8000-000000000002', 'path_course', 'Path course', 0, 20, 1, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE
  label = VALUES(label),
  requires_target_ref = VALUES(requires_target_ref),
  sort_order = VALUES(sort_order),
  is_active = VALUES(is_active),
  updated_at = CURRENT_TIMESTAMP(3);
