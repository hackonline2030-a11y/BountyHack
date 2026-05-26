import type {
  CreateQualityCategoryInput,
  CreateQualityCriterionInput,
  CreateQualityDistributionInput,
  CreateQualityTargetTypeInput,
  QualityCategoryWire,
  QualityCheckWire,
  QualityCriterionWire,
  QualityDistributionWire,
  UpdateQualityCategoryInput,
  UpdateQualityCriterionInput,
  UpdateQualityDistributionInput,
  UpdateQualityTargetTypeInput,
} from '../models/quality-api.types';

export const I_QUALITY_REPOSITORY = Symbol('I_QUALITY_REPOSITORY');

export interface IQualityRepository {
  // Categories
  listCategories(): Promise<QualityCategoryWire[]>;
  findCategoryById(id: string): Promise<QualityCategoryWire | null>;
  createCategory(input: CreateQualityCategoryInput): Promise<QualityCategoryWire>;
  updateCategory(
    id: string,
    input: UpdateQualityCategoryInput,
  ): Promise<QualityCategoryWire>;
  deleteCategory(id: string): Promise<void>;

  // Target types
  listTargetTypes(activeOnly?: boolean): Promise<import('../models/quality-api.types').QualityTargetTypeWire[]>;
  findTargetTypeById(id: string): Promise<import('../models/quality-api.types').QualityTargetTypeWire | null>;
  findTargetTypeByCode(
    code: string,
  ): Promise<import('../models/quality-api.types').QualityTargetTypeWire | null>;
  createTargetType(
    input: CreateQualityTargetTypeInput,
  ): Promise<import('../models/quality-api.types').QualityTargetTypeWire>;
  updateTargetType(
    id: string,
    input: UpdateQualityTargetTypeInput,
  ): Promise<import('../models/quality-api.types').QualityTargetTypeWire>;
  deleteTargetType(id: string): Promise<void>;
  countTargetTypeUsages(targetTypeId: string): Promise<{
    linkCount: number;
    distributionCount: number;
  }>;

  // Criteria
  listCriteriaByStatus(
    status: 'draft' | 'published' | 'archived',
    createdByUserId?: string,
  ): Promise<QualityCriterionWire[]>;
  findCriterionById(id: string): Promise<QualityCriterionWire | null>;
  findCriterionByCode(code: string): Promise<QualityCriterionWire | null>;
  createCriterion(
    createdByUserId: string,
    input: CreateQualityCriterionInput,
  ): Promise<QualityCriterionWire>;
  updateCriterion(
    id: string,
    input: UpdateQualityCriterionInput,
  ): Promise<QualityCriterionWire>;
  deleteCriterion(id: string): Promise<void>;
  publishCriterion(id: string): Promise<QualityCriterionWire>;
  archiveCriterion(id: string): Promise<QualityCriterionWire>;

  // Distributions
  findDistributionById(id: string): Promise<QualityDistributionWire | null>;
  createDistribution(
    distributedByUserId: string,
    input: CreateQualityDistributionInput,
    targetTypeId: string,
  ): Promise<QualityDistributionWire>;
  updateDistribution(
    id: string,
    input: UpdateQualityDistributionInput,
  ): Promise<QualityDistributionWire>;
  deleteDistribution(id: string): Promise<void>;
  listDistributionsForInstance(
    targetTypeCode: string,
    targetRefId: string | null,
  ): Promise<QualityDistributionWire[]>;
  listReportDraftIdsForCriterionDistribution(
    criterionId: string,
  ): Promise<string[]>;
  listReportSpecificDistributionCounts(): Promise<
    Array<{ criterionId: string; count: number }>
  >;

  // Checks
  upsertCheck(
    distributionId: string,
    context: string,
    checked: boolean,
    checkedByUserId: string,
  ): Promise<QualityCheckWire>;
}
