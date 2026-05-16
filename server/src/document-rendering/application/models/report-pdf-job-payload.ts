import type { ReportPdfRequest } from '../commands/generate-report-pdf.command';

/**
 * What we persist in Redis for each BullMQ job.
 * `requestedByUid` ties the job to the JWT user so only they can poll status (first-layer authorization).
 */
export type ReportPdfJobPayload = ReportPdfRequest & {
  requestedByUid: string;
};
