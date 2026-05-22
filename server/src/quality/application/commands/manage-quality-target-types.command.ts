import { Injectable } from '@nestjs/common';
import type { Identity } from '../../../auth/domain/models/identity';
import type {
  CreateQualityTargetTypeInput,
  QualityTargetTypeWire,
  UpdateQualityTargetTypeInput,
} from '../../models/quality-api.types';
import type { IQualityRepository } from '../../ports/quality-repository.interface';
import { QualityAccessPolicy } from '../quality-access.policy';

@Injectable()
export class ManageQualityTargetTypesCommand {
  constructor(
    private readonly repository: IQualityRepository,
    private readonly access: QualityAccessPolicy,
  ) {}

  list(activeOnly?: boolean): Promise<QualityTargetTypeWire[]> {
    return this.repository.listTargetTypes(activeOnly);
  }

  create(
    identity: Identity,
    input: CreateQualityTargetTypeInput,
  ): Promise<QualityTargetTypeWire> {
    this.access.assertQualityCriteriaManager(identity);
    return this.repository.createTargetType(input);
  }

  update(
    identity: Identity,
    id: string,
    input: UpdateQualityTargetTypeInput,
  ): Promise<QualityTargetTypeWire> {
    this.access.assertQualityCriteriaManager(identity);
    return this.repository.updateTargetType(id, input);
  }

  async delete(identity: Identity, id: string): Promise<void> {
    this.access.assertQualityCriteriaManager(identity);
    await this.repository.deleteTargetType(id);
  }
}
