import { Injectable } from '@nestjs/common';
import type { Identity } from '../../../auth/domain/models/identity';
import type { GlobalSubmissionWire } from '../../models/global-submission-api.types';
import type { ReviewerRoleWire } from '../../models/report-draft-api.types';
import type { IReportDraftRepository } from '../../ports/report-draft-repository.interface';
import type { IGlobalSubmissionRepository } from '../../ports/global-submission-repository.interface';
import { ReportDraftAccessPolicy } from '../report-draft-access.policy';

export type ListGlobalSubmissionsInput =
  | { kind: 'draftId'; draftId: string }
  | { kind: 'pendingForReviewer'; reviewerRole: ReviewerRoleWire }
  | { kind: 'forReviewer'; reviewerRole: ReviewerRoleWire };

@Injectable()
export class ListGlobalSubmissionsQuery {
  constructor(
    private readonly repository: IGlobalSubmissionRepository,
    private readonly reportDraftRepository: IReportDraftRepository,
    private readonly access: ReportDraftAccessPolicy,
  ) {}

  async execute(
    identity: Identity,
    input: ListGlobalSubmissionsInput,
  ): Promise<GlobalSubmissionWire[]> {
    switch (input.kind) {
      case 'draftId': {
        const draft = await this.reportDraftRepository.findById(input.draftId);
        if (draft === null) {
          return [];
        }
        await this.access.assertCanReadDraft(identity, draft);
        return this.repository.findByDraftId(input.draftId);
      }
      case 'pendingForReviewer':
        this.access.assertCanQueryReviewerRole(identity, input.reviewerRole);
        return this.repository.findPendingForReviewerRole(input.reviewerRole);
      case 'forReviewer':
        this.access.assertCanQueryReviewerRole(identity, input.reviewerRole);
        return this.repository.findAllForReviewerRole(input.reviewerRole);
      default: {
        const _exhaustive: never = input;
        return _exhaustive;
      }
    }
  }
}
