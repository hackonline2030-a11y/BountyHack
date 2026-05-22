import type {
  Submission,
  SubmissionAttachmentSnapshot,
} from '../../../generated/prisma/client';
import { SubmissionKind } from '../../../generated/prisma/enums';
import type { AttachmentWire, SubmissionWire } from '../../models/report-draft-api.types';
import { ReportDraftEnumMapper } from './report-draft-enum.mapper';

export type SubmissionWithSnapshots = Submission & {
  attachmentSnapshots: SubmissionAttachmentSnapshot[];
};

/** Separates submission id from draft attachment id in snapshot PKs. */
const SNAPSHOT_ID_SEP = '__';

export class SubmissionPrismaMapper {
  /**
   * DB primary key for `submission_attachment_snapshots`.
   * Must be unique per submission round — re-submitting the same draft
   * attachment after QC revision must not reuse the attachment id alone.
   */
  static snapshotPersistedId(submissionId: string, draftAttachmentId: string): string {
    return `${submissionId}${SNAPSHOT_ID_SEP}${draftAttachmentId}`;
  }

  /**
   * Wire / API attachment id (draft row id for image URLs).
   * Legacy rows used the draft attachment id as the snapshot PK.
   */
  static draftAttachmentIdFromSnapshotRow(
    row: SubmissionAttachmentSnapshot,
  ): string {
    const idx = row.id.indexOf(SNAPSHOT_ID_SEP);
    if (idx >= 0) {
      return row.id.slice(idx + SNAPSHOT_ID_SEP.length);
    }
    return row.id;
  }
  static toDomain(row: SubmissionWithSnapshots): SubmissionWire {
    return {
      id: row.id,
      reportDraftId: row.reportDraftId,
      step: ReportDraftEnumMapper.stepNumberFromDraftStep(row.step),
      round: row.round,
      payload: row.payload as Record<string, unknown>,
      attachmentsSnapshot: row.attachmentSnapshots.map((a) =>
        this.attachmentSnapshotToWire(a),
      ),
      submittedAt: row.submittedAt.toISOString(),
      submittedBy: row.submittedBy,
      reviewerRole: ReportDraftEnumMapper.reviewerRoleToWire(row.reviewerRole),
      decision: ReportDraftEnumMapper.decisionToWire(row.decision),
      decidedAt: row.decidedAt?.toISOString(),
      decidedBy: row.decidedBy ?? undefined,
    };
  }

  static persistenceFromWire(
    wire: SubmissionWire,
    reportDraftStepId: string,
  ): {
    id: string;
    reportDraftStepId: string;
    reportDraftId: string;
    step: ReturnType<typeof ReportDraftEnumMapper.draftStepFromStepNumber>;
    round: number;
    submissionKind: typeof SubmissionKind.HUNTER_TO_REVIEWER;
    payload: object;
    submittedAt: Date;
    submittedBy: string;
    reviewerRole: ReturnType<typeof ReportDraftEnumMapper.reviewerRoleFromWire>;
    decision: ReturnType<typeof ReportDraftEnumMapper.decisionFromWire>;
    decidedAt: Date | null;
    decidedBy: string | null;
    attachments: AttachmentWire[];
  } {
    return {
      id: wire.id,
      reportDraftStepId,
      reportDraftId: wire.reportDraftId,
      step: ReportDraftEnumMapper.draftStepFromStepNumber(wire.step),
      round: wire.round,
      submissionKind: SubmissionKind.HUNTER_TO_REVIEWER,
      payload: wire.payload,
      submittedAt: new Date(wire.submittedAt),
      submittedBy: wire.submittedBy,
      reviewerRole: ReportDraftEnumMapper.reviewerRoleFromWire(wire.reviewerRole),
      decision: ReportDraftEnumMapper.decisionFromWire(wire.decision),
      decidedAt: wire.decidedAt ? new Date(wire.decidedAt) : null,
      decidedBy: wire.decidedBy ?? null,
      attachments: wire.attachmentsSnapshot,
    };
  }

  private static attachmentSnapshotToWire(
    row: SubmissionAttachmentSnapshot,
  ): AttachmentWire {
    return {
      id: this.draftAttachmentIdFromSnapshotRow(row),
      filename: row.filename,
      mimeType: row.mimeType,
      sizeBytes: row.sizeBytes,
      storageKey: row.storageKey,
      thumbnailUrl: row.thumbnailUrl ?? undefined,
      uploadedAt: row.uploadedAt.toISOString(),
      uploadedBy: row.uploadedBy,
    };
  }

  static attachmentSnapshotCreateInput(
    submissionId: string,
    attachment: AttachmentWire,
  ) {
    return {
      id: this.snapshotPersistedId(submissionId, attachment.id),
      submissionId,
      filename: attachment.filename,
      mimeType: attachment.mimeType,
      sizeBytes: attachment.sizeBytes,
      storageKey: attachment.storageKey,
      thumbnailUrl: attachment.thumbnailUrl ?? null,
      uploadedAt: new Date(attachment.uploadedAt),
      uploadedBy: attachment.uploadedBy,
    };
  }
}
