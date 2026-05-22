import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Identity } from '../../../auth/domain/models/identity';
import type {
  CreateQualityCriterionInput,
  QualityCriterionWire,
  UpdateQualityCriterionInput,
} from '../../models/quality-api.types';
import type { IQualityRepository } from '../../ports/quality-repository.interface';
import { QualityAccessPolicy } from '../quality-access.policy';

@Injectable()
export class ManageQualityCriteriaCommand {
  constructor(
    private readonly repository: IQualityRepository,
    private readonly access: QualityAccessPolicy,
  ) {}

  listMyDrafts(identity: Identity): Promise<QualityCriterionWire[]> {
    this.access.assertQualityCriteriaManager(identity);
    return this.repository.listCriteriaByStatus('draft', identity.uid);
  }

  listPublished(identity: Identity): Promise<QualityCriterionWire[]> {
    this.access.assertCanReadPublishedCatalog(identity);
    return this.repository.listCriteriaByStatus('published');
  }

  async getById(identity: Identity, id: string): Promise<QualityCriterionWire> {
    const row = await this.repository.findCriterionById(id);
    if (row === null) {
      throw new NotFoundException('Criterion not found');
    }
    if (row.status === 'draft') {
      this.access.assertCanReadOwnDraftCriterion(identity, row.createdByUserId);
    } else {
      this.access.assertCanReadPublishedCatalog(identity);
    }
    return row;
  }

  create(
    identity: Identity,
    input: CreateQualityCriterionInput,
  ): Promise<QualityCriterionWire> {
    this.access.assertQualityCriteriaManager(identity);
    try {
      return this.repository.createCriterion(identity.uid, input);
    } catch (err) {
      throw this.wrapValidation(err);
    }
  }

  async update(
    identity: Identity,
    id: string,
    input: UpdateQualityCriterionInput,
  ): Promise<QualityCriterionWire> {
    this.access.assertQualityCriteriaManager(identity);
    const row = await this.repository.findCriterionById(id);
    if (row === null) {
      throw new NotFoundException('Criterion not found');
    }
    if (row.status === 'archived') {
      throw new BadRequestException('Archived criteria cannot be updated');
    }
    try {
      return await this.repository.updateCriterion(id, input);
    } catch (err) {
      throw this.wrapValidation(err);
    }
  }

  async delete(identity: Identity, id: string): Promise<void> {
    this.access.assertQualityCriteriaManager(identity);
    await this.repository.deleteCriterion(id);
  }

  publish(identity: Identity, id: string): Promise<QualityCriterionWire> {
    this.access.assertQualityCriteriaManager(identity);
    return this.repository.publishCriterion(id);
  }

  archive(identity: Identity, id: string): Promise<QualityCriterionWire> {
    this.access.assertQualityCriteriaManager(identity);
    return this.repository.archiveCriterion(id);
  }

  private wrapValidation(err: unknown): Error {
    if (err instanceof Error && !(err instanceof BadRequestException)) {
      if (
        err.message.includes('Criterion code') ||
        err.message.includes('Explanation must')
      ) {
        return new BadRequestException(err.message);
      }
    }
    return err instanceof Error ? err : new Error(String(err));
  }
}
