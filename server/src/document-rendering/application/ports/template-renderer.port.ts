import { CvTemplate } from '../../domain/entities/cv-template.entity';

export const I_TEMPLATE_RENDERER = 'I_TEMPLATE_RENDERER';

export interface ITemplateRenderer {
  renderCv(data: CvTemplate): Promise<string>;
}
