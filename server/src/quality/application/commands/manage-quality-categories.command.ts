import { Injectable } from '@nestjs/common';
import type { Identity } from '../../../auth/domain/models/identity';
import type {
  CreateQualityCategoryInput,
  QualityCategoryWire,
  UpdateQualityCategoryInput,
} from '../../models/quality-api.types';
import type { IQualityRepository } from '../../ports/quality-repository.interface';
import { QualityAccessPolicy } from '../quality-access.policy';

@Injectable()
export class ManageQualityCategoriesCommand {
  constructor(
    private readonly repository: IQualityRepository,
    private readonly access: QualityAccessPolicy,
  ) {}

  list(): Promise<QualityCategoryWire[]> {
    return this.repository.listCategories();
  }

  create(
    identity: Identity,
    input: CreateQualityCategoryInput,
  ): Promise<QualityCategoryWire> {
    this.access.assertQualityCriteriaManager(identity);
    return this.repository.createCategory(input);
  }

  update(
    identity: Identity,
    id: string,
    input: UpdateQualityCategoryInput,
  ): Promise<QualityCategoryWire> {
    this.access.assertQualityCriteriaManager(identity);
    return this.repository.updateCategory(id, input);
  }

  async delete(identity: Identity, id: string): Promise<void> {
    this.access.assertQualityCriteriaManager(identity);
    await this.repository.deleteCategory(id);
  }
}
