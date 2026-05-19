/**
 * Dev-only HTTP routes (report-draft JSON inspector, etc.).
 * Disabled when NODE_ENV=production — remove dev modules before shipping prod.
 */
export function isReportDraftDevRoutesEnabled(): boolean {
  return process.env.NODE_ENV !== 'production';
}
