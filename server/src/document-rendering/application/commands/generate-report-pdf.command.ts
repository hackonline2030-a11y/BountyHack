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
import {
  I_PDF_GENERATOR,
  IPdfGenerator,
} from '../ports/pdf-generator.port';
import {
  I_PDF_STORAGE,
  IPdfStorage,
} from '../ports/pdf-storage.port';

export type ReportPdfRequest = {
  style?: string;
  version?: string;
  locale?: string;
};
type Response = { url: string };

export class GenerateReportPdfCommand
  implements Executable<ReportPdfRequest, Response>
{
  constructor(
    @Inject(I_REPORT_REPOSITORY)
    private readonly reportRepository: IReportRepository,
    @Inject(I_TEMPLATE_RENDERER)
    private readonly templateRenderer: ITemplateRenderer,
    @Inject(I_PDF_GENERATOR)
    private readonly pdfGenerator: IPdfGenerator,
    @Inject(I_PDF_STORAGE)
    private readonly pdfStorage: IPdfStorage,
  ) {}

  async execute(request: ReportPdfRequest = {}): Promise<Response> {
    const reportData = await this.reportRepository.getReportTemplateData(
      request.style,
      request.version,
      request.locale,
    );
    const html = await this.templateRenderer.renderReport(reportData);
    const pdfBuffer = await this.pdfGenerator.generateFromHtml(html);
    const { publicUrl } = await this.pdfStorage.savePdf(
      pdfBuffer,
      reportData.templateName,
    );
    return { url: publicUrl };
  }
}
