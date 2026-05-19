import { ReportTemplate } from '../../domain/entities/report-template.entity';

export const I_REPORT_DRAFT_DOCUMENT_REPOSITORY =
  'I_REPORT_DRAFT_DOCUMENT_REPOSITORY';

export type PublishedDraftListItemReadModel = {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
};

export interface IReportDraftDocumentRepository {
  listPublishedDrafts(): Promise<PublishedDraftListItemReadModel[]>;
  getDocumentTemplateData(
    draftId: string,
    locale?: string,
  ): Promise<ReportTemplate>;
}
