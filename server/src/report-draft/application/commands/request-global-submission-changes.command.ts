import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { Identity } from '../../../auth/domain/models/identity';
import type { GlobalReviewerCommentWire } from '../../models/global-submission-api.types';
import type { ReportDraftWire } from '../../models/report-draft-api.types';
import type { IGlobalSubmissionRepository } from '../../ports/global-submission-repository.interface';
import type { IGlobalReviewerCommentRepository } from '../../ports/global-reviewer-comment-repository.interface';
import type { IReportDraftRepository } from '../../ports/report-draft-repository.interface';
import { ReportDraftAccessPolicy } from '../report-draft-access.policy';
import { reviewerRoleFromIdentity } from '../reviewer-role-from-identity';

const GENERAL_FIELD = '__general__';

@Injectable()
export class RequestGlobalSubmissionChangesCommand {
  constructor(
    private readonly globalSubmissionRepository: IGlobalSubmissionRepository,
    private readonly commentRepository: IGlobalReviewerCommentRepository,
    private readonly reportDraftRepository: IReportDraftRepository,
    private readonly access: ReportDraftAccessPolicy,
  ) {}

  async execute(
    identity: Identity,
    globalSubmissionId: string,
    commentBodies: ReadonlyArray<string>,
  ): Promise<ReportDraftWire> {
    const globalSubmission =
      await this.globalSubmissionRepository.findById(globalSubmissionId);
    if (globalSubmission === null) {
      throw new NotFoundException('Global submission not found');
    }

    await this.access.assertCanDecideGlobalSubmission(identity, globalSubmission);

    if (globalSubmission.decision !== 'pending') {
      throw new BadRequestException('Global submission has already been decided');
    }

    const trimmed = commentBodies.map((b) => b.trim()).filter((b) => b.length > 0);
    if (trimmed.length === 0) {
      throw new BadRequestException(
        'At least one comment is required when requesting global revisions',
      );
    }

    const now = new Date().toISOString();
    const authorRole = reviewerRoleFromIdentity(identity);
    const comments: GlobalReviewerCommentWire[] = trimmed.map((body) => ({
      id: randomUUID(),
      globalSubmissionId,
      authorId: identity.uid,
      authorRole,
      anchor: { field: GENERAL_FIELD },
      body,
      createdAt: now,
    }));

    await this.commentRepository.saveMany(comments);
    await this.globalSubmissionRepository.recordDecision({
      globalSubmissionId,
      decision: 'request-changes',
      decidedBy: identity.uid,
    });

    const draft = await this.reportDraftRepository.findById(
      globalSubmission.reportDraftId,
    );
    if (draft === null) {
      throw new NotFoundException('Report draft not found');
    }
    return draft;
  }
}
