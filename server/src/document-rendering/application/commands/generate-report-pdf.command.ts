import { Inject } from '@nestjs/common';
import { Executable } from '../../../shared/executable';
import {
  I_REPORT_DRAFT_DOCUMENT_REPOSITORY,
  IReportDraftDocumentRepository,
} from '../ports/report-draft-document-repository.port';
import {
  I_TEMPLATE_RENDERER,
  ITemplateRenderer,
} from '../ports/template-renderer.port';
import {
  I_PDF_GENERATOR,
  IPdfGenerator,
} from '../ports/pdf-generator.port';

export type ReportPdfRequest = {
  draftId: string;
  locale?: string;
};

export type GenerateReportPdfResult = {
  buffer: Buffer;
  fileName: string;
};

export class GenerateReportPdfCommand
  implements Executable<ReportPdfRequest, GenerateReportPdfResult>
{
  constructor(
    @Inject(I_REPORT_DRAFT_DOCUMENT_REPOSITORY)
    private readonly documentRepository: IReportDraftDocumentRepository,
    @Inject(I_TEMPLATE_RENDERER)
    private readonly templateRenderer: ITemplateRenderer,
    @Inject(I_PDF_GENERATOR)
    private readonly pdfGenerator: IPdfGenerator,
  ) {}

  async execute(request: ReportPdfRequest): Promise<GenerateReportPdfResult> {
    const reportData = await this.documentRepository.getDocumentTemplateData(
      request.draftId,
      request.locale,
    );
    const html = await this.templateRenderer.renderReport(reportData);
    const buffer = await this.pdfGenerator.generateFromHtml(html);
    const safeTemplate =
      (reportData.templateName || 'report').replace(/[^a-zA-Z0-9_-]/g, '') ||
      'report';
    const fileName = `${safeTemplate}-${request.draftId.slice(0, 8)}.pdf`;
    return { buffer, fileName };
  }
}
