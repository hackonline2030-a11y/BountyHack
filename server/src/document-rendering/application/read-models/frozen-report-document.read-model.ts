/** One long-form wizard step rendered as a PDF section. */
export type FrozenReportSectionReadModel = {
  key: string;
  title: string;
  sectionBlocs: Array<Record<string, unknown>>;
};

export type FrozenReportTeamMemberReadModel = {
  userId: string;
  displayName: string;
  role: string;
};

/** View model passed to `templates/report-final/index.ejs` (from `reports.frozen_content`). */
export interface FrozenReportDocumentReadModel {
  htmlLang: string;
  language: string;
  templateName: string;
  templateStylesheetUrl: string;
  reportId: string;
  reportStatus: string;
  sourceDraftId: string;
  draftVersion: number;
  hunterId: string;
  frozenAt: string;
  title: string;
  meta: Record<string, unknown>;
  cvss: Record<string, unknown>;
  sections: FrozenReportSectionReadModel[];
  reportTeam: {
    label: string;
    members: FrozenReportTeamMemberReadModel[];
  } | null;
  labels: Record<string, string>;
}
