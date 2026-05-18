import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  DraftStep,
  ReportDraftAggregateStatus,
  ReportStatus,
  ReviewerRole,
  StepStatus,
  SubmissionDecision,
} from '../../../generated/prisma/enums';
import { buildFrozenContentFromDraft } from './promote-draft-to-report';
import { PrismaService } from '../../../core/infrastructure/database/prisma/prisma.service';
import { AppRoleCode } from '../../../shared/rbac/app-role.code';
import type { Identity } from '../../../auth/domain/models/identity';
import type {
  ReportDraftStepStateKeyWire,
  ReportDraftWire,
  ReviewerCommentWire,
  SubmissionStepWire,
  SubmissionWire,
} from '../../models/report-draft-api.types';
import { REPORT_DRAFT_STEP_STATE_KEYS } from '../../models/report-draft-api.types';
import { IReportDraftRepository } from '../../ports/report-draft-repository.interface';
import { IGlobalSubmissionRepository } from '../../ports/global-submission-repository.interface';
import { ISubmissionRepository } from '../../ports/submission-repository.interface';
import { IReviewerCommentRepository } from '../../ports/reviewer-comment-repository.interface';
const GENERAL_COMMENT_FIELD = '__general__';

const STEP_BY_KEY: Record<ReportDraftStepStateKeyWire, DraftStep> = {
  meta: DraftStep.META,
  description: DraftStep.DESCRIPTION,
  collection: DraftStep.COLLECTION,
  exploitation: DraftStep.EXPLOITATION,
  proofOfConcept: DraftStep.PROOF_OF_CONCEPT,
  risks: DraftStep.RISKS,
  remediation: DraftStep.REMEDIATION,
  final: DraftStep.FINAL,
};

const WIRE_STEP_BY_DRAFT_STEP: Record<DraftStep, SubmissionStepWire> = {
  [DraftStep.META]: 0,
  [DraftStep.DESCRIPTION]: 1,
  [DraftStep.COLLECTION]: 2,
  [DraftStep.EXPLOITATION]: 3,
  [DraftStep.PROOF_OF_CONCEPT]: 4,
  [DraftStep.RISKS]: 5,
  [DraftStep.REMEDIATION]: 6,
  [DraftStep.FINAL]: 7,
};

export type SuperAdminStepCommentInput = {
  step: ReportDraftStepStateKeyWire;
  body: string;
};

@Injectable()
export class SuperAdminFinalValidationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reportDraftRepository: IReportDraftRepository,
    private readonly globalSubmissionRepository: IGlobalSubmissionRepository,
    private readonly submissionRepository: ISubmissionRepository,
    private readonly commentRepository: IReviewerCommentRepository,
  ) {}

  assertSuperAdmin(identity: Identity): void {
    if (identity.roleCode !== AppRoleCode.SUPER_ADMIN) {
      throw new ForbiddenException('Super admin required');
    }
  }

  canApproveFinalValidation(draft: ReportDraftWire): boolean {
    return (
      draft.aggregateStatus === 'ready-to-program' &&
      draft.final.status === 'approved'
    );
  }

  async approveFinalValidation(
    identity: Identity,
    draftId: string,
  ): Promise<ReportDraftWire> {
    this.assertSuperAdmin(identity);
    const draft = await this.requireDraft(draftId);
    const draftRow = await this.prisma.reportDraft.findUnique({
      where: { id: draftId },
      select: { pendingReportId: true, aggregateStatus: true },
    });
    if (draftRow === null) {
      throw new NotFoundException('Report draft not found');
    }

    if (draft.aggregateStatus === 'submitted-to-program') {
      if (draftRow.pendingReportId) {
        return draft;
      }
      await this.promoteDraftToPendingReport(draft, identity.uid);
      return (await this.reportDraftRepository.findById(draftId))!;
    }

    if (!this.canApproveFinalValidation(draft)) {
      throw new BadRequestException(
        'Draft is not ready for final validation (requires ready-to-program status and approved final step)',
      );
    }

    await this.promoteDraftToPendingReport(draft, identity.uid);
    return (await this.reportDraftRepository.findById(draftId))!;
  }

  /** Creates a pending `reports` row and links it on the draft (idempotent if already linked). */
  private async promoteDraftToPendingReport(
    draft: ReportDraftWire,
    promotedBy: string,
  ): Promise<void> {
    const now = new Date();
    const existing = await this.prisma.reportDraft.findUnique({
      where: { id: draft.id },
      select: { pendingReportId: true },
    });
    if (existing?.pendingReportId) {
      await this.prisma.reportDraft.update({
        where: { id: draft.id },
        data: {
          aggregateStatus: ReportDraftAggregateStatus.SUBMITTED_TO_PROGRAM,
          superAdminRevisionRequestedAt: null,
          updatedAt: now,
        },
      });
      return;
    }

    const reportId = randomUUID();
    const frozenContent = buildFrozenContentFromDraft(draft, now);

    await this.prisma.$transaction(async (tx) => {
      await tx.report.create({
        data: {
          id: reportId,
          hunterId: draft.hunterId,
          sourceDraftId: draft.id,
          status: ReportStatus.PENDING,
          frozenContent: frozenContent as object,
          contentSyncedAt: now,
          promotedBy,
        },
      });
      await tx.reportDraft.update({
        where: { id: draft.id },
        data: {
          aggregateStatus: ReportDraftAggregateStatus.SUBMITTED_TO_PROGRAM,
          pendingReportId: reportId,
          superAdminRevisionRequestedAt: null,
          updatedAt: now,
        },
      });
    });
  }

  async requestFinalRevision(
    identity: Identity,
    draftId: string,
  ): Promise<ReportDraftWire> {
    this.assertSuperAdmin(identity);
    const draft = await this.requireDraft(draftId);

    if (draft.aggregateStatus !== 'ready-to-program') {
      throw new BadRequestException(
        'Global revision can only be requested when the draft is ready-to-program',
      );
    }

    if ((draft.superAdminGlobalRevisionCount ?? 0) > 0) {
      throw new BadRequestException(
        'Super-admin global revision was already requested for this draft',
      );
    }

    const submissions = await this.submissionRepository.findByDraftId(draftId);
    const hasSuperAdminComment = await this.hasSuperAdminGeneralComments(
      draftId,
      submissions,
    );
    if (!hasSuperAdminComment) {
      throw new BadRequestException(
        'Add at least one super-admin comment before requesting revision',
      );
    }

    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.reportDraft.update({
        where: { id: draftId },
        data: {
          aggregateStatus: ReportDraftAggregateStatus.UNDER_GLOBAL_REVIEW,
          superAdminRevisionRequestedAt: now,
          superAdminGlobalRevisionCount: { increment: 1 },
          updatedAt: now,
        },
      });
      await this.resetAllStepsToInProgressInTx(tx, draftId);
    });

    return (await this.reportDraftRepository.findById(draftId))!;
  }

  private async resetAllStepsToInProgress(draftId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await this.resetAllStepsToInProgressInTx(tx, draftId);
      await tx.reportDraft.update({
        where: { id: draftId },
        data: { updatedAt: new Date() },
      });
    });
  }

  private async resetAllStepsToInProgressInTx(
    tx: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
    draftId: string,
  ): Promise<void> {
    for (const key of REPORT_DRAFT_STEP_STATE_KEYS) {
      await tx.reportDraftStep.updateMany({
        where: {
          reportDraftId: draftId,
          step: STEP_BY_KEY[key],
        },
        data: {
          status: StepStatus.IN_GLOBAL_PROGRESS,
          assignedReviewerRole: null,
        },
      });
    }
  }

  async saveStepComments(
    identity: Identity,
    draftId: string,
    inputs: ReadonlyArray<SuperAdminStepCommentInput>,
  ): Promise<ReviewerCommentWire[]> {
    this.assertSuperAdmin(identity);
    await this.requireDraft(draftId);

    const saved: ReviewerCommentWire[] = [];
    const now = new Date().toISOString();

    for (const input of inputs) {
      const body = input.body.trim();
      if (!body) continue;

      const step = STEP_BY_KEY[input.step];
      const submission = await this.ensureSuperAdminSubmission(
        draftId,
        step,
        identity.uid,
      );

      const comment: ReviewerCommentWire = {
        id: randomUUID(),
        submissionId: submission.id,
        authorId: identity.uid,
        authorRole: 'super_admin',
        anchor: { field: GENERAL_COMMENT_FIELD },
        body,
        createdAt: now,
      };
      await this.commentRepository.saveMany([comment]);
      saved.push(comment);
    }

    return saved;
  }

  private async requireDraft(draftId: string): Promise<ReportDraftWire> {
    const draft = await this.reportDraftRepository.findById(draftId);
    if (draft === null) {
      throw new NotFoundException('Report draft not found');
    }
    return draft;
  }

  private async hasSuperAdminGeneralComments(
    draftId: string,
    submissions: SubmissionWire[],
  ): Promise<boolean> {
    for (const sub of submissions) {
      if (sub.reportDraftId !== draftId || sub.reviewerRole !== 'super_admin') {
        continue;
      }
      const comments = await this.commentRepository.findBySubmissionId(sub.id);
      if (comments.some((c) => c.authorRole === 'super_admin' && c.body.trim())) {
        return true;
      }
    }
    return false;
  }

  private async ensureSuperAdminSubmission(
    draftId: string,
    step: DraftStep,
    superAdminId: string,
  ): Promise<SubmissionWire> {
    const wireStep = WIRE_STEP_BY_DRAFT_STEP[step];
    const existing = (await this.submissionRepository.findByDraftId(draftId)).filter(
      (s) => s.step === wireStep && s.reviewerRole === 'super_admin',
    );
    if (existing.length > 0) {
      return existing.reduce((best, cur) => (cur.round >= best.round ? cur : best));
    }

    const stepRow = await this.prisma.reportDraftStep.findUnique({
      where: {
        reportDraftId_step: { reportDraftId: draftId, step },
      },
    });
    if (stepRow === null) {
      throw new NotFoundException('Report draft step not found');
    }

    const submission: SubmissionWire = {
      id: randomUUID(),
      reportDraftId: draftId,
      step: wireStep,
      round: stepRow.currentRound + 1,
      payload: (stepRow.payload as Record<string, unknown>) ?? {},
      attachmentsSnapshot: [],
      submittedAt: new Date().toISOString(),
      submittedBy: superAdminId,
      reviewerRole: 'super_admin',
      decision: 'pending',
    };

    await this.prisma.submission.create({
      data: {
        id: submission.id,
        reportDraftStepId: stepRow.id,
        reportDraftId: draftId,
        step,
        round: submission.round,
        payload: submission.payload as object,
        submittedAt: new Date(submission.submittedAt),
        submittedBy: superAdminId,
        reviewerRole: ReviewerRole.SUPER_ADMIN,
        decision: SubmissionDecision.PENDING,
      },
    });

    return submission;
  }
}
