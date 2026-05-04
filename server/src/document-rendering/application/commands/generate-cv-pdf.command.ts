import { Inject } from '@nestjs/common';
import { Executable } from '../../../shared/executable';
import {
  I_CV_REPOSITORY,
  ICvRepository,
} from '../ports/cv-repository.port';
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

export type CvPdfRequest = { style?: string; version?: string; locale?: string };
type Response = { url: string };

export class GenerateCvPdfCommand implements Executable<
  CvPdfRequest,
  Response
> {
  constructor(
    @Inject(I_CV_REPOSITORY)
    private readonly cvRepository: ICvRepository,
    @Inject(I_TEMPLATE_RENDERER)
    private readonly templateRenderer: ITemplateRenderer,
    @Inject(I_PDF_GENERATOR)
    private readonly pdfGenerator: IPdfGenerator,
    @Inject(I_PDF_STORAGE)
    private readonly pdfStorage: IPdfStorage,
  ) {}

  async execute(request: CvPdfRequest = {}): Promise<Response> {
    const cvData = await this.cvRepository.getCvTemplateData(
      request.style,
      request.version,
      request.locale,
    );
    const html = await this.templateRenderer.renderCv(cvData);
    const pdfBuffer = await this.pdfGenerator.generateFromHtml(html);
    const { publicUrl } = await this.pdfStorage.savePdf(
      pdfBuffer,
      cvData.templateName,
    );
    return { url: publicUrl };
  }
}
