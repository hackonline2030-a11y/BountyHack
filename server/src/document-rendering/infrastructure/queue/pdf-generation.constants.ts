/**
 * BullMQ queue name — must match @InjectQueue(...) and @Processor(...).
 * One logical "pipe" for all report-PDF jobs; concurrency is controlled by the worker, not by HTTP threads.
 */
export const PDF_GENERATION_QUEUE = 'pdf-generation' as const;

/** Job name inside the queue (discriminator for metrics / dashboards). */
export const REPORT_PDF_JOB_NAME = 'generate-report-pdf' as const;
