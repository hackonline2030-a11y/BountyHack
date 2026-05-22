import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Identity } from '../../../auth/domain/models/identity';
import { reportTitleFromMetaPayload } from '../../../report-draft/application/mappers/report-draft-to-final-validation-summary.mapper';
import {
  I_REPORT_DRAFT_REPOSITORY,
  type IReportDraftRepository,
} from '../../../report-draft/ports/report-draft-repository.interface';
import type { ReportDraftWire } from '../../../report-draft/models/report-draft-api.types';
import type { QualityReportDraftTargetWire } from '../../models/quality-report-draft-target.types';
import type { IQualityRepository } from '../../ports/quality-repository.interface';
import { I_QUALITY_REPOSITORY } from '../../ports/quality-repository.interface';
import { QualityAccessPolicy } from '../quality-access.policy';

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
export class ListQualityCriterionReportTargetsQuery {
  constructor(
    @Inject(I_QUALITY_REPOSITORY)
    private readonly repository: IQualityRepository,
    private readonly access: QualityAccessPolicy,
    @Inject(I_REPORT_DRAFT_REPOSITORY)
    private readonly reportDraftRepository: IReportDraftRepository,
  ) {}

  async execute(
    identity: Identity,
    criterionId: string,
  ): Promise<QualityReportDraftTargetWire[]> {
    const criterion = await this.repository.findCriterionById(criterionId);
    if (criterion === null) {
      throw new NotFoundException('Criterion not found');
    }
    this.access.assertCanReadCriterionReportTargets(identity, criterion.status);
    const draftIds =
      await this.repository.listReportDraftIdsForCriterionDistribution(
        criterionId,
      );
    const targets: QualityReportDraftTargetWire[] = [];
    for (const id of draftIds) {
      const draft = await this.reportDraftRepository.findById(id);
      if (draft !== null) {
        targets.push(toTargetWire(draft));
      }
    }
    return targets.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
}
