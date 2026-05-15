import { ForbiddenException, Injectable } from '@nestjs/common';
import { AppRoleCode } from '../../shared/rbac/app-role.code';
import type { Identity } from '../../auth/domain/models/identity';
import type {
  ReviewerRoleWire,
  SubmissionWire,
} from '../models/report-draft-api.types';
import type { IReportDraftRepository } from '../ports/report-draft-repository.interface';
import type { ISubmissionRepository } from '../ports/submission-repository.interface';

@Injectable()
export class ReportDraftAccessPolicy {
  constructor(
    private readonly reportDraftRepository: IReportDraftRepository,
    private readonly submissionRepository: ISubmissionRepository,
  ) {}

  async assertDraftOwnedByHunter(
    identity: Identity,
    draftId: string,
  ): Promise<void> {
    const draft = await this.reportDraftRepository.findById(draftId);
    if (draft === null || draft.hunterId !== identity.uid) {
      throw new ForbiddenException('Cannot access this report draft');
    }
  }

  async assertCanReadSubmission(
    identity: Identity,
    submission: SubmissionWire,
  ): Promise<void> {
    const draft = await this.reportDraftRepository.findById(
      submission.reportDraftId,
    );
    if (draft === null) {
      throw new ForbiddenException('Cannot access this submission');
    }
    if (draft.hunterId === identity.uid) {
      return;
    }
    if (this.identityMatchesReviewerRole(identity, submission.reviewerRole)) {
      return;
    }
    throw new ForbiddenException('Cannot access this submission');
  }

  assertCanQueryReviewerRole(
    identity: Identity,
    reviewerRole: ReviewerRoleWire,
  ): void {
    if (!this.identityMatchesReviewerRole(identity, reviewerRole)) {
      throw new ForbiddenException(
        'Cannot list submissions for this reviewer role',
      );
    }
  }

  async assertCanSaveSubmission(
    identity: Identity,
    submission: SubmissionWire,
  ): Promise<void> {
    const draft = await this.reportDraftRepository.findById(
      submission.reportDraftId,
    );
    if (draft === null) {
      throw new ForbiddenException('Cannot save submission for unknown draft');
    }

    const isHunterSubmit =
      submission.decision === 'pending' &&
      submission.submittedBy === identity.uid &&
      draft.hunterId === identity.uid;

    const isReviewerDecision =
      submission.decision !== 'pending' &&
      submission.decidedBy === identity.uid &&
      this.identityMatchesReviewerRole(identity, submission.reviewerRole);

    if (isHunterSubmit || isReviewerDecision) {
      return;
    }

    throw new ForbiddenException('Cannot save this submission');
  }

  async assertCanReadComments(
    identity: Identity,
    submissionId: string,
  ): Promise<void> {
    const submission = await this.submissionRepository.findById(submissionId);
    if (submission === null) {
      throw new ForbiddenException('Cannot access comments for submission');
    }
    await this.assertCanReadSubmission(identity, submission);
  }

  async assertCanSaveComments(
    identity: Identity,
    submissionId: string,
    authorIds: string[],
  ): Promise<void> {
    const submission = await this.submissionRepository.findById(submissionId);
    if (submission === null) {
      throw new ForbiddenException('Cannot save comments for submission');
    }
    if (!authorIds.every((id) => id === identity.uid)) {
      throw new ForbiddenException('Comment author must match authenticated user');
    }
    if (!this.identityMatchesReviewerRole(identity, submission.reviewerRole)) {
      throw new ForbiddenException('Only the assigned reviewer can add comments');
    }
  }

  private identityMatchesReviewerRole(
    identity: Identity,
    reviewerRole: ReviewerRoleWire,
  ): boolean {
    switch (reviewerRole) {
      case 'quality_checker':
        return identity.roleCode === AppRoleCode.QUALITY_CHECKER;
      case 'mentor':
        return identity.roleCode === AppRoleCode.MENTOR;
      case 'super_admin':
        return identity.roleCode === AppRoleCode.SUPER_ADMIN;
      case 'hunter':
        return identity.roleCode === AppRoleCode.HUNTER;
      default:
        return false;
    }
  }
}
