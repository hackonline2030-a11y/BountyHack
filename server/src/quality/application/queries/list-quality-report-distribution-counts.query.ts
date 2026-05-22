import { Inject, Injectable } from '@nestjs/common';
import type { Identity } from '../../../auth/domain/models/identity';
import type { IQualityRepository } from '../../ports/quality-repository.interface';
import { I_QUALITY_REPOSITORY } from '../../ports/quality-repository.interface';
import { QualityAccessPolicy } from '../quality-access.policy';

export type QualityReportDistributionCountWire = {
  criterionId: string;
  count: number;
};

@Injectable()
export class ListQualityReportDistributionCountsQuery {
  constructor(
    @Inject(I_QUALITY_REPOSITORY)
    private readonly repository: IQualityRepository,
    private readonly access: QualityAccessPolicy,
  ) {}

  async execute(
    identity: Identity,
  ): Promise<QualityReportDistributionCountWire[]> {
    this.access.assertCanReadPublishedCatalog(identity);
    const counts =
      await this.repository.listReportSpecificDistributionCounts();
    const publishedIds = new Set(
      (await this.repository.listCriteriaByStatus('published')).map(
        (c) => c.id,
      ),
    );
    return counts.filter((row) => publishedIds.has(row.criterionId));
  }
}
