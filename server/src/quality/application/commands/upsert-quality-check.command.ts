import { Injectable, NotFoundException } from '@nestjs/common';
import type { Identity } from '../../../auth/domain/models/identity';
import type { QualityCheckWire } from '../../models/quality-api.types';
import type { IQualityRepository } from '../../ports/quality-repository.interface';
import { QualityAccessPolicy } from '../quality-access.policy';
import { QualityTargetHandlerRegistry } from '../target-handlers/quality-target-handler.registry';

@Injectable()
export class UpsertQualityCheckCommand {
  constructor(
    private readonly repository: IQualityRepository,
    private readonly access: QualityAccessPolicy,
    private readonly targetHandlers: QualityTargetHandlerRegistry,
  ) {}

  async execute(
    identity: Identity,
    distributionId: string,
    context: string,
    checked: boolean,
  ): Promise<QualityCheckWire> {
    this.access.assertCanUpdateCheck(identity);
    const distribution = await this.repository.findDistributionById(distributionId);
    if (distribution === null) {
      throw new NotFoundException('Distribution not found');
    }
    const handler = this.targetHandlers.get(distribution.targetType.code);
    this.targetHandlers.assertValidCheckContext(
      distribution.targetType.code,
      context,
    );
    await handler.assertCanUpdateCheck(identity, distribution.targetRefId);
    return this.repository.upsertCheck(
      distributionId,
      context,
      checked,
      identity.uid,
    );
  }
}
