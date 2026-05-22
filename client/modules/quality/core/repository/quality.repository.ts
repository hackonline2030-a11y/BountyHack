import type {
  QualityCategory,
  QualityCriterion,
  QualityDistribution,
  QualityReportDraftTarget,
  QualityTargetType,
} from "@modules/quality/model/quality.types";

export interface IQualityRepository {
  listCategories(): Promise<QualityCategory[]>;
  createCategory(input: {
    name: string;
    color: string;
    sortOrder?: number;
  }): Promise<QualityCategory>;
  updateCategory(
    id: string,
    input: { name?: string; color?: string; sortOrder?: number },
  ): Promise<QualityCategory>;
  deleteCategory(id: string): Promise<void>;

  listTargetTypes(activeOnly?: boolean): Promise<QualityTargetType[]>;

  listDraftCriteria(): Promise<QualityCriterion[]>;
  listPublishedCriteria(): Promise<QualityCriterion[]>;
  createCriterion(input: {
    code: string;
    title: string;
    explanation?: string | null;
    categoryId?: string | null;
    targetTypeIds: string[];
  }): Promise<QualityCriterion>;
  updateCriterion(
    id: string,
    input: {
      title?: string;
      explanation?: string | null;
      categoryId?: string | null;
      targetTypeIds?: string[];
    },
  ): Promise<QualityCriterion>;
  deleteCriterion(id: string): Promise<void>;
  publishCriterion(id: string): Promise<QualityCriterion>;
  archiveCriterion(id: string): Promise<QualityCriterion>;

  listReportDraftTargets(): Promise<QualityReportDraftTarget[]>;

  listInstanceCriteria(
    targetTypeCode: string,
    targetRefId: string | null,
    context?: string,
  ): Promise<QualityDistribution[]>;
  createDistribution(input: {
    criterionId: string;
    targetTypeCode: string;
    targetRefId?: string | null;
    contexts: string[];
  }): Promise<QualityDistribution>;
  deleteDistribution(id: string): Promise<void>;
  upsertCheck(
    distributionId: string,
    context: string,
    checked: boolean,
  ): Promise<void>;
}
