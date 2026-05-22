import { Inject, Injectable } from '@nestjs/common';
import type { Identity } from '../../../auth/domain/models/identity';
import { reportTitleFromMetaPayload } from '../../../report-draft/application/mappers/report-draft-to-final-validation-summary.mapper';
import { ReportDraftAccessPolicy } from '../../../report-draft/application/report-draft-access.policy';
import {
  I_REPORT_DRAFT_REPOSITORY,
  type IReportDraftRepository,
} from '../../../report-draft/ports/report-draft-repository.interface';
import type { ReportDraftWire } from '../../../report-draft/models/report-draft-api.types';
import type { QualityReportDraftTargetWire } from '../../models/quality-report-draft-target.types';

function toTargetWire(draft: ReportDraftWire): QualityReportDraftTargetWire {
  const title = reportTitleFromMetaPayload(draft.meta.payload);
  return {
    id: draft.id,
    reportTitle: title || draft.id,
    teamLabel: draft.reportTeam?.label?.trim() || null,
    aggregateStatus: draft.aggregateStatus,
    updatedAt: draft.updatedAt,
  };
}

@Injectable()
export class ListQualityReportDraftTargetsQuery {
  constructor(
    @Inject(I_REPORT_DRAFT_REPOSITORY)
    private readonly reportDraftRepository: IReportDraftRepository,
    private readonly reportDraftAccess: ReportDraftAccessPolicy,
  ) {}

  async execute(identity: Identity): Promise<QualityReportDraftTargetWire[]> {
    const scopedIds =
      await this.reportDraftAccess.draftIdsForScopedReviewerList(identity);

    const drafts: ReportDraftWire[] =
      scopedIds === null
        ? await this.reportDraftRepository.findAll()
        : (
            await Promise.all(
              scopedIds.map((id) => this.reportDraftRepository.findById(id)),
            )
          ).filter((d): d is ReportDraftWire => d !== null);

    const targets: QualityReportDraftTargetWire[] = [];
    for (const draft of drafts) {
      try {
        await this.reportDraftAccess.assertCanReadDraft(identity, draft);
        targets.push(toTargetWire(draft));
      } catch {
        // Skip drafts outside caller scope (defensive; scoped list should align).
      }
    }

    return targets.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
}
