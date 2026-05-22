import { Injectable } from '@nestjs/common';
import type { Identity } from '../../../auth/domain/models/identity';
import type { IReportDraftRepository } from '../../ports/report-draft-repository.interface';
import type { ISubmissionRepository } from '../../ports/submission-repository.interface';
import type { ReportDraftWire } from '../../models/report-draft-api.types';
import {
  repairDraftWorkflowDriftFromSubmissions,
  reportDraftWorkflowChanged,
} from '../report-draft-reviewer-sync';
import { ReportDraftAccessPolicy } from '../report-draft-access.policy';
import { syncSkippedFinalWizardStep } from '../hunter-wizard-steps';

@Injectable()
export class GetReportDraftByIdQuery {
  constructor(
    private readonly repository: IReportDraftRepository,
    private readonly submissionRepository: ISubmissionRepository,
    private readonly access: ReportDraftAccessPolicy,
  ) {}

  async execute(
    identity: Identity,
    draftId: string,
  ): Promise<ReportDraftWire | null> {
    const draft = await this.repository.findById(draftId);
    if (draft === null) {
      return null;
    }
    await this.access.assertCanReadDraft(identity, draft);

    const submissions = await this.submissionRepository.findByDraftId(draftId);
    let next = repairDraftWorkflowDriftFromSubmissions(draft, submissions);
    next = syncSkippedFinalWizardStep(next);
    if (reportDraftWorkflowChanged(draft, next)) {
      await this.repository.save(next);
      return next;
    }

    return next;
  }
}
