import { ReportTemplate } from '../../domain/entities/report-template.entity';

export const I_TEMPLATE_RENDERER = 'I_TEMPLATE_RENDERER';

export interface ITemplateRenderer {
  renderReport(data: ReportTemplate): Promise<string>;
}
