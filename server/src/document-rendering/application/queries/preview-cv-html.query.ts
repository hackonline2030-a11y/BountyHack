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

export type CvPreviewRequest = { style?: string; version?: string; locale?: string };
type Response = string;

export class PreviewCvHtmlQuery implements Executable<CvPreviewRequest, Response> {
  constructor(
    @Inject(I_CV_REPOSITORY)
    private readonly cvRepository: ICvRepository,
    @Inject(I_TEMPLATE_RENDERER)
    private readonly templateRenderer: ITemplateRenderer,
  ) {}

  async execute(request: CvPreviewRequest = {}): Promise<Response> {
    const cvData = await this.cvRepository.getCvTemplateData(
      request.style,
      request.version,
      request.locale,
    );
    return this.templateRenderer.renderCv(cvData);
  }
}
