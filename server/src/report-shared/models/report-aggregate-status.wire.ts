/**
 * Shared kernel between the `report-draft` and `report-team` bounded contexts.
 *
 * `AggregateStatusWire` is the report-draft workflow status exposed on the wire.
 * It lives here (rather than inside `report-draft`) so that `report-team` can
 * reference the linked draft status without importing `report-draft`, which would
 * reintroduce the report-draft ↔ report-team dependency cycle.
 */
export type AggregateStatusWire =
  | 'draft'
  | 'under-review'
  | 'under-global-review'
  | 'ready-to-program'
  /** @deprecated Prefer `published`. */
  | 'submitted-to-program'
  /** Super-admin validated — source of truth for PDF generation. */
  | 'published'
  | 'given-up'
  | 'rejected';
