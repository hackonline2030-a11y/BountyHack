import { ForbiddenException, Injectable } from '@nestjs/common';
import { AppRoleCode } from '../../../shared/rbac/app-role.code';
import type { Identity } from '../../../auth/domain/models/identity';
import type {
  ReviewerRoleWire,
  SubmissionWire,
} from '../../models/report-draft-api.types';
import type { IReportDraftRepository } from '../../ports/report-draft-repository.interface';
import type { ISubmissionRepository } from '../../ports/submission-repository.interface';
import type { IReportTeamRepository } from '../../../report-team/ports/report-team-repository.interface';
import { ReportDraftAccessPolicy } from '../report-draft-access.policy';

export type ListSubmissionsInput =
  | { kind: 'draftId'; draftId: string }
  | { kind: 'pendingForReviewer'; reviewerRole: ReviewerRoleWire }
  | { kind: 'forReviewer'; reviewerRole: ReviewerRoleWire }
  | { kind: 'mentorPeerForQc' };

@Injectable()
export class ListSubmissionsQuery {
  constructor(
    private readonly repository: ISubmissionRepository,
    private readonly reportDraftRepository: IReportDraftRepository,
    private readonly access: ReportDraftAccessPolicy,
    private readonly reportTeamRepository: IReportTeamRepository,
  ) {}

  async execute(
    identity: Identity,
    input: ListSubmissionsInput,
  ): Promise<SubmissionWire[]> {
    switch (input.kind) {
      case 'draftId': {
        const draft = await this.reportDraftRepository.findById(input.draftId);
        if (draft === null) {
          return [];
        }
        await this.access.assertCanReadDraft(identity, draft);
        return this.repository.findByDraftId(input.draftId);
      }
      case 'pendingForReviewer': {
        this.access.assertCanQueryReviewerRole(identity, input.reviewerRole);
        const draftIds = await this.access.draftIdsForScopedReviewerList(identity);
        return this.repository.findPendingForReviewerRoleInDrafts(
          input.reviewerRole,
          draftIds,
        );
      }
      case 'forReviewer': {
        this.access.assertCanQueryReviewerRole(identity, input.reviewerRole);
        const draftIds = await this.access.draftIdsForScopedReviewerList(identity);
        return this.repository.findAllForReviewerRoleInDrafts(
          input.reviewerRole,
          draftIds,
        );
      }
      case 'mentorPeerForQc':
        if (
          identity.roleCode !== AppRoleCode.QUALITY_CHECKER &&
          identity.roleCode !== AppRoleCode.SUPER_ADMIN
        ) {
          throw new ForbiddenException(
            'Mentor peer submissions are visible to quality checkers only',
          );
        }
        {
          const draftIds =
            await this.reportTeamRepository.findDraftIdsForMember(identity.uid);
          return this.repository.findMentorSubmissionsForDraftIds(draftIds);
        }
    }
  }
}
