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

export type ReportPreviewRequest = {
  draftId: string;
  locale?: string;
};
type Response = string;

export class PreviewReportHtmlQuery
  implements Executable<ReportPreviewRequest, Response>
{
  constructor(
    @Inject(I_REPORT_DRAFT_DOCUMENT_REPOSITORY)
    private readonly documentRepository: IReportDraftDocumentRepository,
    @Inject(I_TEMPLATE_RENDERER)
    private readonly templateRenderer: ITemplateRenderer,
  ) {}

  async execute(request: ReportPreviewRequest): Promise<Response> {
    const reportData = await this.documentRepository.getDocumentTemplateData(
      request.draftId,
      request.locale,
    );
    return this.templateRenderer.renderReport(reportData);
  }
}
