import type { ReportDraftStepStateKeyWire } from './report-draft-api.types';

export type AdminReportDraftAttachmentRowWire = {
  attachmentId: string;
  reportDraftId: string;
  reportTitle: string;
  reportTeamLabel: string | null;
  stepKey: ReportDraftStepStateKeyWire;
  storageKey: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  uploadedBy: string;
};
