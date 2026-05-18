import { ReportTemplate } from '../../domain/entities/report-template.entity';

export const I_REPORT_REPOSITORY = 'I_REPORT_REPOSITORY';

export type ReportListItemReadModel = {
  id: string;
  status: string;
  title: string;
  sourceDraftId: string;
  updatedAt: string;
};

export interface IReportRepository {
  listReports(): Promise<ReportListItemReadModel[]>;
  getReportTemplateData(
    reportId: string,
    locale?: string,
  ): Promise<ReportTemplate>;
}
