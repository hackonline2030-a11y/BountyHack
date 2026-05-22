export const REPORT_QUALITY_CHECK_CONTEXTS = [
  'submission_review',
  'global_submission_review',
] as const;

export type ReportQualityCheckContext =
  (typeof REPORT_QUALITY_CHECK_CONTEXTS)[number];

export function isReportQualityCheckContext(
  value: string,
): value is ReportQualityCheckContext {
  return (REPORT_QUALITY_CHECK_CONTEXTS as readonly string[]).includes(value);
}
