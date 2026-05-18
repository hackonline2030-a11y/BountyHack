/** One line on the cover table of contents (thesis-style dotted leaders). */
export type FrozenReportTocEntryReadModel = {
  label: string;
  page: number;
  bold?: boolean;
};

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

/** View model passed to `templates/report-final/index.ejs` (from published `report_drafts` steps). */
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
  /** Display name for « par … » on the cover page. */
  authorName: string;
  tableOfContents: FrozenReportTocEntryReadModel[];
  meta: Record<string, unknown>;
  cvss: Record<string, unknown>;
  sections: FrozenReportSectionReadModel[];
  reportTeam: {
    label: string;
    members: FrozenReportTeamMemberReadModel[];
  } | null;
  labels: Record<string, string>;
}
