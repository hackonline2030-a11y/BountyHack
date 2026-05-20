import { DraftStep, ReviewerRole, SubmissionDecision } from '../../../generated/prisma/enums';
import { SubmissionKind } from '../../../generated/prisma/enums';
import type { AttachmentWire } from '../../models/report-draft-api.types';
import {
  SubmissionPrismaMapper,
  type SubmissionWithSnapshots,
} from './submission-prisma.mapper';

describe('SubmissionPrismaMapper', () => {
  it('maps prisma submission to wire JSON', () => {
    const row: SubmissionWithSnapshots = {
      id: 'sub-1',
      reportDraftStepId: 'step-1',
      reportDraftId: 'draft-1',
      step: DraftStep.META,
      round: 1,
      submissionKind: SubmissionKind.HUNTER_TO_REVIEWER,
      payload: { reportTitle: 'XSS' },
      submittedAt: new Date('2026-05-15T12:00:00.000Z'),
      submittedBy: 'hunter-1',
      reviewerRole: ReviewerRole.QUALITY_CHECKER,
      decision: SubmissionDecision.PENDING,
      decidedAt: null,
      decidedBy: null,
      attachmentSnapshots: [],
    };

    const wire = SubmissionPrismaMapper.toDomain(row);
    expect(wire.step).toBe(0);
    expect(wire.reviewerRole).toBe('quality_checker');
    expect(wire.decision).toBe('pending');
    expect(wire.payload).toEqual({ reportTitle: 'XSS' });
  });

  it('uses composite snapshot PKs so the same draft attachment can be re-submitted', () => {
    const attachment: AttachmentWire = {
      id: 'att-8f0890cc',
      filename: 'poc.png',
      mimeType: 'image/png',
      sizeBytes: 1024,
      storageKey: 'drafts/d1/description/poc.png',
      uploadedAt: '2026-05-15T12:00:00.000Z',
      uploadedBy: 'hunter-1',
    };

    const round1 = SubmissionPrismaMapper.attachmentSnapshotCreateInput(
      'sub-round-1',
      attachment,
    );
    const round2 = SubmissionPrismaMapper.attachmentSnapshotCreateInput(
      'sub-round-2',
      attachment,
    );

    expect(round1.id).not.toBe(round2.id);
    expect(round1.id).toBe('sub-round-1__att-8f0890cc');
    expect(round2.id).toBe('sub-round-2__att-8f0890cc');

    const wire = SubmissionPrismaMapper.toDomain({
      id: 'sub-round-2',
      reportDraftStepId: 'step-1',
      reportDraftId: 'draft-1',
      step: DraftStep.DESCRIPTION,
      round: 2,
      submissionKind: SubmissionKind.HUNTER_TO_REVIEWER,
      payload: {},
      submittedAt: new Date('2026-05-16T12:00:00.000Z'),
      submittedBy: 'hunter-1',
      reviewerRole: ReviewerRole.QUALITY_CHECKER,
      decision: SubmissionDecision.PENDING,
      decidedAt: null,
      decidedBy: null,
      attachmentSnapshots: [
        {
          id: round2.id,
          submissionId: 'sub-round-2',
          filename: attachment.filename,
          mimeType: attachment.mimeType,
          sizeBytes: attachment.sizeBytes,
          storageKey: attachment.storageKey,
          thumbnailUrl: null,
          uploadedAt: new Date(attachment.uploadedAt),
          uploadedBy: attachment.uploadedBy,
        },
      ],
    });

    expect(wire.attachmentsSnapshot[0].id).toBe('att-8f0890cc');
  });

  it('reads legacy snapshots whose PK was the draft attachment id alone', () => {
    const wire = SubmissionPrismaMapper.toDomain({
      id: 'sub-legacy',
      reportDraftStepId: 'step-1',
      reportDraftId: 'draft-1',
      step: DraftStep.DESCRIPTION,
      round: 1,
      submissionKind: SubmissionKind.HUNTER_TO_REVIEWER,
      payload: {},
      submittedAt: new Date('2026-05-15T12:00:00.000Z'),
      submittedBy: 'hunter-1',
      reviewerRole: ReviewerRole.QUALITY_CHECKER,
      decision: SubmissionDecision.PENDING,
      decidedAt: null,
      decidedBy: null,
      attachmentSnapshots: [
        {
          id: 'att-legacy-only',
          submissionId: 'sub-legacy',
          filename: 'old.png',
          mimeType: 'image/png',
          sizeBytes: 1,
          storageKey: 'k',
          thumbnailUrl: null,
          uploadedAt: new Date('2026-05-15T12:00:00.000Z'),
          uploadedBy: 'hunter-1',
        },
      ],
    });

    expect(wire.attachmentsSnapshot[0].id).toBe('att-legacy-only');
  });
});
