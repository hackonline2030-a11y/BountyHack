import { ForbiddenException, Injectable } from '@nestjs/common';
import { AppRoleCode } from '../../shared/rbac/app-role.code';
import type { Identity } from '../../auth/domain/models/identity';
import type {
  ReviewerRoleWire,
  SubmissionWire,
} from '../models/report-draft-api.types';
import type { IReportDraftRepository } from '../ports/report-draft-repository.interface';
import type { ISubmissionRepository } from '../ports/submission-repository.interface';
import type { IReportTeamRepository } from '../../report-team/ports/report-team-repository.interface';

@Injectable()
export class ReportDraftAccessPolicy {
  constructor(
    private readonly reportDraftRepository: IReportDraftRepository,
    private readonly submissionRepository: ISubmissionRepository,
    private readonly reportTeamRepository: IReportTeamRepository,
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

  /** Hunter owns the draft, or staff reviewers persist QC/mentor review outcomes. */
  assertCanSaveDraft(identity: Identity, draft: { hunterId: string }): void {
    if (draft.hunterId === identity.uid) {
      return;
    }
    if (this.isReviewerStaff(identity)) {
      return;
    }
    throw new ForbiddenException(
      'Cannot save a report draft owned by another hunter',
    );
  }

  async assertCanReadDraft(
    identity: Identity,
    draft: { id: string; hunterId: string },
  ): Promise<void> {
    if (draft.hunterId === identity.uid) {
      return;
    }
    if (this.isReviewerStaff(identity)) {
      return;
    }
    if (identity.roleCode === AppRoleCode.COORDINATOR) {
      return;
    }
    const isTeamMember = await this.reportTeamRepository.isMemberOfDraft(
      identity.uid,
      draft.id,
    );
    if (isTeamMember) {
      return;
    }
    throw new ForbiddenException('Cannot access this report draft');
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
    if (await this.canReadPeerReviewerSubmission(identity, submission)) {
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

    if (isHunterSubmit) {
      return;
    }

    if (
      submission.decision !== 'pending' &&
      submission.decidedBy === identity.uid
    ) {
      if (submission.decision === 'approve') {
        if (
          identity.roleCode !== AppRoleCode.QUALITY_CHECKER &&
          identity.roleCode !== AppRoleCode.SUPER_ADMIN
        ) {
          throw new ForbiddenException(
            'Only a quality checker can approve a wizard step',
          );
        }
        if (
          submission.reviewerRole !== 'quality_checker' &&
          submission.reviewerRole !== 'super_admin'
        ) {
          throw new ForbiddenException(
            'Step approval applies to quality-checker submissions only',
          );
        }
        return;
      }

      if (submission.decision === 'endorse') {
        if (identity.roleCode !== AppRoleCode.MENTOR) {
          throw new ForbiddenException(
            'Only a mentor can record an advisory endorsement',
          );
        }
        if (submission.reviewerRole !== 'mentor') {
          throw new ForbiddenException(
            'Endorsement applies to mentor-targeted submissions only',
          );
        }
        return;
      }

      if (this.identityMatchesReviewerRole(identity, submission.reviewerRole)) {
        return;
      }
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

  private isReviewerStaff(identity: Identity): boolean {
    return (
      identity.roleCode === AppRoleCode.QUALITY_CHECKER ||
      identity.roleCode === AppRoleCode.MENTOR ||
      identity.roleCode === AppRoleCode.SUPER_ADMIN
    );
  }

  /** Mentor and QC on the same report team can read each other's review threads. */
  private async canReadPeerReviewerSubmission(
    identity: Identity,
    submission: SubmissionWire,
  ): Promise<boolean> {
    if (
      submission.reviewerRole !== 'mentor' &&
      submission.reviewerRole !== 'quality_checker'
    ) {
      return false;
    }
    if (
      identity.roleCode !== AppRoleCode.MENTOR &&
      identity.roleCode !== AppRoleCode.QUALITY_CHECKER &&
      identity.roleCode !== AppRoleCode.SUPER_ADMIN
    ) {
      return false;
    }
    return this.reportTeamRepository.isMemberOfDraft(
      identity.uid,
      submission.reportDraftId,
    );
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
