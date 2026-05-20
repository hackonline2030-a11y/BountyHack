import { ForbiddenException, Injectable } from '@nestjs/common';
import { AppRoleCode } from '../../shared/rbac/app-role.code';
import type { Identity } from '../../auth/domain/models/identity';
import type { GlobalSubmissionWire } from '../models/global-submission-api.types';
import type {
  ReportDraftWire,
  ReviewerRoleWire,
  SubmissionWire,
} from '../models/report-draft-api.types';
import type { IReportDraftRepository } from '../ports/report-draft-repository.interface';
import type { ISubmissionRepository } from '../ports/submission-repository.interface';
import type { IReportTeamRepository } from '../../report-team/ports/report-team-repository.interface';
import type { IUserRepository } from '../../users/ports/user-repository.interface';

@Injectable()
export class ReportDraftAccessPolicy {
  constructor(
    private readonly reportDraftRepository: IReportDraftRepository,
    private readonly submissionRepository: ISubmissionRepository,
    private readonly reportTeamRepository: IReportTeamRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  /**
   * Only the user designated as `hunter_writer_id` may perform hunter-side
   * submissions (step submit, global batch, etc.) when acting as a hunter.
   */
  async assertActingHunterWriter(
    identity: Identity,
    draftId: string,
  ): Promise<void> {
    const draft = await this.reportDraftRepository.findById(draftId);
    if (draft === null || draft.hunterWriterId !== identity.uid) {
      throw new ForbiddenException(
        'Only the designated hunter writer can perform this action',
      );
    }
  }

  /**
   * - Coordinators may assign the writer using squad membership only (no report-draft read).
   * - Squad hunters may hand off the writer role to another hunter on the team.
   * - Without a report team, only the draft owner may be the writer (no reassignment).
   * - Super admins may assign the writer for squads (after draft read check).
   */
  async assertCanAssignHunterWriter(
    identity: Identity,
    draft: ReportDraftWire,
    newWriterId: string,
  ): Promise<void> {
    if (identity.roleCode === AppRoleCode.COORDINATOR) {
      const members = await this.squadMembersForDraft(draft);
      if (members.length === 0) {
        throw new ForbiddenException(
          'A report team is required to assign the designated writer from this role',
        );
      }
      const target = members.find(
        (m) => m.userId === newWriterId && m.role === 'hunter',
      );
      if (!target) {
        throw new ForbiddenException(
          'The designated writer must be a hunter on this squad',
        );
      }
      return;
    }

    await this.assertCanReadDraft(identity, draft);

    if (identity.roleCode === AppRoleCode.SUPER_ADMIN) {
      const members = await this.squadMembersForDraft(draft);
      if (members.length === 0) {
        throw new ForbiddenException(
          'A report team is required to assign the designated writer from this role',
        );
      }
      const target = members.find(
        (m) => m.userId === newWriterId && m.role === 'hunter',
      );
      if (!target) {
        throw new ForbiddenException(
          'The designated writer must be a hunter on this squad',
        );
      }
      return;
    }

    if (identity.roleCode !== AppRoleCode.HUNTER) {
      throw new ForbiddenException('Only hunters can change the designated writer');
    }
    if (!draft.reportTeam) {
      if (newWriterId !== draft.hunterId) {
        throw new ForbiddenException(
          'Without a squad, the draft owner must remain the writer',
        );
      }
      if (identity.uid !== draft.hunterId) {
        throw new ForbiddenException('Cannot reassign writer on this draft');
      }
      return;
    }
    const members = draft.reportTeam.members;
    const caller = members.find((m) => m.userId === identity.uid);
    if (!caller || caller.role !== 'hunter') {
      throw new ForbiddenException(
        'Only squad hunters can change the designated writer',
      );
    }
    const target = members.find((m) => m.userId === newWriterId);
    if (!target || target.role !== 'hunter') {
      throw new ForbiddenException(
        'The designated writer must be a hunter on this squad',
      );
    }
  }

  /**
   * Coordinators and super admins may change `report_drafts.hunter_id` to any user
   * registered in `users` with global role `HUNTER` (not limited to current squad).
   */
  async assertCanSetPrimaryHunter(
    identity: Identity,
    draft: ReportDraftWire,
    newHunterId: string,
  ): Promise<void> {
    void draft;
    if (
      identity.roleCode !== AppRoleCode.COORDINATOR &&
      identity.roleCode !== AppRoleCode.SUPER_ADMIN
    ) {
      throw new ForbiddenException('Coordinator or super admin required');
    }
    const user = await this.userRepository.findSummaryById(newHunterId);
    if (user === null || user.roleCode !== AppRoleCode.HUNTER) {
      throw new ForbiddenException(
        'The primary hunter must be an existing user with the hunter role',
      );
    }
  }

  private async squadMembersForDraft(
    draft: ReportDraftWire,
  ): Promise<ReadonlyArray<{ userId: string; role: string }>> {
    if (draft.reportTeam?.members?.length) {
      return draft.reportTeam.members;
    }
    const team = await this.reportTeamRepository.findByReportDraftId(draft.id);
    return team?.members ?? [];
  }

  /**
   * Hunter sans équipe : uniquement ses brouillons (`hunter_id`).
   * Hunter en équipe : brouillons des équipes dont il est membre (+ orphelins qu’il possède).
   * Mentor / QC : uniquement via `report_team_members`.
   * Super admin : tous les brouillons.
   */
  async assertCanSaveDraft(
    identity: Identity,
    draft: { id: string; hunterId: string; hunterWriterId: string },
  ): Promise<void> {
    await this.assertCanReadDraft(identity, draft);
    if (this.isSuperAdmin(identity)) {
      return;
    }
    if (identity.roleCode === AppRoleCode.HUNTER) {
      if (identity.uid !== draft.hunterWriterId) {
        throw new ForbiddenException(
          'Only the designated hunter writer can save this draft',
        );
      }
      return;
    }
    throw new ForbiddenException(
      'Only the designated hunter writer or a super admin can save this draft',
    );
  }

  async assertCanReadDraft(
    identity: Identity,
    draft: { id: string; hunterId: string },
  ): Promise<void> {
    if (this.isSuperAdmin(identity)) {
      return;
    }
    if (identity.roleCode === AppRoleCode.COORDINATOR) {
      throw new ForbiddenException(
        'Coordinators cannot access report draft content; manage teams via report-team coordination only',
      );
    }
    if (identity.roleCode === AppRoleCode.HUNTER) {
      if (await this.hunterCanAccessDraft(identity.uid, draft)) {
        return;
      }
      throw new ForbiddenException('Cannot access this report draft');
    }
    if (await this.hasTeamAccessToDraft(identity.uid, draft)) {
      return;
    }
    throw new ForbiddenException('Cannot access this report draft');
  }

  /**
   * Files d’attente reviewer (QC, mentor, hunter…) : limitées aux brouillons des équipes du caller.
   * `null` = pas de filtre (super admin uniquement).
   */
  async draftIdsForScopedReviewerList(
    identity: Identity,
  ): Promise<readonly string[] | null> {
    if (this.isSuperAdmin(identity)) {
      return null;
    }
    return this.reportTeamRepository.findDraftIdsForMember(identity.uid);
  }

  /** Hunter sans aucune équipe : seulement les brouillons dont il est `hunter_id`. */
  private async hunterCanAccessDraft(
    userId: string,
    draft: { id: string; hunterId: string },
  ): Promise<boolean> {
    const teamDraftIds =
      await this.reportTeamRepository.findDraftIdsForMember(userId);
    if (teamDraftIds.length === 0) {
      return draft.hunterId === userId;
    }
    return this.hasTeamAccessToDraft(userId, draft);
  }

  private async hasTeamAccessToDraft(
    userId: string,
    draft: { id: string; hunterId: string },
  ): Promise<boolean> {
    if (
      await this.reportTeamRepository.isMemberOfDraft(userId, draft.id)
    ) {
      return true;
    }
    const team = await this.reportTeamRepository.findByReportDraftId(draft.id);
    if (!team && draft.hunterId === userId) {
      return true;
    }
    return false;
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
    await this.assertCanReadDraft(identity, draft);
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
      draft.hunterWriterId === identity.uid;

    if (isHunterSubmit) {
      return;
    }

    await this.assertCanReadDraft(identity, draft);

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

  async assertCanDecideGlobalSubmission(
    identity: Identity,
    globalSubmission: GlobalSubmissionWire,
  ): Promise<void> {
    if (globalSubmission.decision !== 'pending') {
      throw new ForbiddenException('Global submission is already decided');
    }
    const draft = await this.reportDraftRepository.findById(
      globalSubmission.reportDraftId,
    );
    if (draft === null) {
      throw new ForbiddenException('Cannot access this global submission');
    }
    await this.assertCanReadDraft(identity, draft);

    if (!draft.superAdminRevisionRequestedAt?.trim()) {
      throw new ForbiddenException('Global revision cycle is closed');
    }

    if (!this.identityMatchesReviewerRole(identity, globalSubmission.reviewerRole)) {
      throw new ForbiddenException(
        'Cannot decide a global submission assigned to another reviewer role',
      );
    }
  }

  async assertCanReadGlobalSubmission(
    identity: Identity,
    globalSubmission: GlobalSubmissionWire,
  ): Promise<void> {
    const draft = await this.reportDraftRepository.findById(
      globalSubmission.reportDraftId,
    );
    if (draft === null) {
      throw new ForbiddenException('Cannot access this global submission');
    }
    await this.assertCanReadDraft(identity, draft);
  }

  async assertCanCommentOnGlobalSubmission(
    identity: Identity,
    globalSubmission: GlobalSubmissionWire,
  ): Promise<void> {
    await this.assertCanReadGlobalSubmission(identity, globalSubmission);
    if (
      identity.roleCode !== AppRoleCode.QUALITY_CHECKER &&
      identity.roleCode !== AppRoleCode.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'Only quality checker or super admin can comment on global submissions',
      );
    }
  }

  async assertCanSaveComments(
    identity: Identity,
    submissionId: string,
    authorIds: string[],
  ): Promise<void> {
    await this.assertCanReadComments(identity, submissionId);
    if (!authorIds.every((id) => id === identity.uid)) {
      throw new ForbiddenException('Comment author must match authenticated user');
    }
    const submission = await this.submissionRepository.findById(submissionId);
    if (submission === null) {
      throw new ForbiddenException('Cannot save comments for submission');
    }
    if (!this.identityMatchesReviewerRole(identity, submission.reviewerRole)) {
      throw new ForbiddenException('Only the assigned reviewer can add comments');
    }
  }

  private isSuperAdmin(identity: Identity): boolean {
    return identity.roleCode === AppRoleCode.SUPER_ADMIN;
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
