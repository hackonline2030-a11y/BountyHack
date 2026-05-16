import { Inject } from '@nestjs/common';
import { Executable } from '../../../shared/executable';
import {
  I_REPORT_REPOSITORY,
  IReportRepository,
} from '../ports/report-repository.port';
import {
  I_TEMPLATE_RENDERER,
  ITemplateRenderer,
} from '../ports/template-renderer.port';

export type ReportPreviewRequest = {
  style?: string;
  version?: string;
  locale?: string;
};
type Response = string;

export class PreviewReportHtmlQuery
  implements Executable<ReportPreviewRequest, Response>
{
  constructor(
    @Inject(I_REPORT_REPOSITORY)
    private readonly reportRepository: IReportRepository,
    @Inject(I_TEMPLATE_RENDERER)
    private readonly templateRenderer: ITemplateRenderer,
  ) {}

  async execute(request: ReportPreviewRequest = {}): Promise<Response> {
    const reportData = await this.reportRepository.getReportTemplateData(
      request.style,
      request.version,
      request.locale,
    );
    return this.templateRenderer.renderReport(reportData);
  }
}
