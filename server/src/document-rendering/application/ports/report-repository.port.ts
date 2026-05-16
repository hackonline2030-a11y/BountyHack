import { ReportTemplate } from '../../domain/entities/report-template.entity';

export const I_REPORT_REPOSITORY = 'I_REPORT_REPOSITORY';

export interface IReportRepository {
  listReportStyles(): Promise<string[]>;
  listReportVersions(style: string): Promise<string[]>;
  listReportLocales(style: string, version: string): Promise<string[]>;
  getReportTemplateData(
    style?: string,
    version?: string,
    locale?: string,
  ): Promise<ReportTemplate>;
}
