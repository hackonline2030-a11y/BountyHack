import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Identity } from '../../../auth/domain/models/identity';
import type {
  CreateQualityDistributionInput,
  QualityDistributionWire,
  UpdateQualityDistributionInput,
} from '../../models/quality-api.types';
import type { IQualityRepository } from '../../ports/quality-repository.interface';
import { QualityAccessPolicy } from '../quality-access.policy';
import { QualityTargetHandlerRegistry } from '../target-handlers/quality-target-handler.registry';

@Injectable()
export class ManageQualityDistributionsCommand {
  constructor(
    private readonly repository: IQualityRepository,
    private readonly access: QualityAccessPolicy,
    private readonly targetHandlers: QualityTargetHandlerRegistry,
  ) {}

  async listForInstance(
    identity: Identity,
    targetTypeCode: string,
    targetRefId: string | null | undefined,
    context?: string,
  ): Promise<QualityDistributionWire[]> {
    const handler = this.targetHandlers.get(targetTypeCode);
    const ref = targetRefId?.trim() || null;
    handler.assertTargetRef(ref);
    await handler.assertCanViewInstance(identity, ref);
    const rows = await this.repository.listDistributionsForInstance(
      targetTypeCode,
      ref,
    );
    if (!context?.trim()) {
      return rows;
    }
    const ctx = context.trim();
    return rows.map((d) => ({
      ...d,
      checks: d.checks.filter((c) => c.context === ctx),
    }));
  }

  async create(
    identity: Identity,
    input: CreateQualityDistributionInput,
  ): Promise<QualityDistributionWire> {
    this.access.assertQualityCriteriaManager(identity);
    const targetType = await this.repository.findTargetTypeByCode(
      input.targetTypeCode,
    );
    if (targetType === null) {
      throw new NotFoundException('Target type not found');
    }
    const handler = this.targetHandlers.get(targetType.code);
    const ref = input.targetRefId?.trim() || null;
    if (targetType.requiresTargetRef && !ref) {
      throw new BadRequestException('targetRefId is required for this target type');
    }
    if (!targetType.requiresTargetRef && ref) {
      throw new BadRequestException(
        'targetRefId must be omitted for this target type',
      );
    }
    handler.assertTargetRef(ref);
    await handler.assertTargetExists(ref);
    for (const ctx of input.contexts) {
      this.targetHandlers.assertValidCheckContext(targetType.code, ctx);
    }
    return this.repository.createDistribution(
      identity.uid,
      input,
      targetType.id,
    );
  }

  async update(
    identity: Identity,
    id: string,
    input: UpdateQualityDistributionInput,
  ): Promise<QualityDistributionWire> {
    this.access.assertQualityCriteriaManager(identity);
    const existing = await this.repository.findDistributionById(id);
    if (existing === null) {
      throw new NotFoundException('Distribution not found');
    }
    if (input.targetRefId !== undefined) {
      const handler = this.targetHandlers.get(existing.targetType.code);
      const ref = input.targetRefId?.trim() || null;
      handler.assertTargetRef(ref);
      await handler.assertTargetExists(ref);
    }
    return this.repository.updateDistribution(id, input);
  }

  async delete(identity: Identity, id: string): Promise<void> {
    this.access.assertQualityCriteriaManager(identity);
    await this.repository.deleteDistribution(id);
  }
}
