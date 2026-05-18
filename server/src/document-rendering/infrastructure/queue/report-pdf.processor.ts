import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { GenerateReportPdfCommand } from '../../application/commands/generate-report-pdf.command';
import type { ReportPdfJobPayload } from '../../application/models/report-pdf-job-payload';
import { PDF_GENERATION_QUEUE } from './pdf-generation.constants';

/**
 * Background worker (article "processor"): runs **outside** the HTTP request lifecycle.
 *
 * - **Performance**: Nest can answer `202` immediately; Puppeteer runs here with bounded
 *   `concurrency` so many users enqueue work without one request blocking the event loop for minutes.
 * - **Redis**: BullMQ stores job payloads and state here — protect Redis like a database (network ACL, password).
 * - **Architecture**: We reuse `GenerateReportPdfCommand` (same use case as sync path) instead of
 *   duplicating Puppeteer in this class.
 */
@Processor(PDF_GENERATION_QUEUE, { concurrency: 2 })
export class ReportPdfProcessor extends WorkerHost {
  constructor(
    private readonly generateReportPdfCommand: GenerateReportPdfCommand,
  ) {
    super();
  }

  async process(
    job: Job<ReportPdfJobPayload, { fileName: string }>,
  ): Promise<{ fileName: string }> {
    const { requestedByUid: _auditUid, ...request } = job.data;
    void _auditUid;

    const { fileName } = await this.generateReportPdfCommand.execute(request);
    return { fileName };
  }
}
