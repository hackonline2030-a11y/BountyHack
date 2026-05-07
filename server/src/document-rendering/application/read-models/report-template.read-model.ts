export interface ReportTemplateReadModel {
  htmlLang: string;
  templateName: string;
  templateStylesheetUrl: string;
  language?: string;
  labels?: Record<string, string>;
  author?: Record<string, unknown>;
  reportMeta?: Record<string, unknown>;
  summaryPage?: Record<string, unknown>;
  tableOfContents?: Array<Record<string, unknown>>;
  sections?: Array<Record<string, unknown>>;
  bugDetails?: Record<string, unknown>;
  bugCharacteristics?: Record<string, unknown>;
  bugDescription?: Record<string, unknown>;
  attachments?: Record<string, unknown>;
  bugChain?: Record<string, unknown>;
}
