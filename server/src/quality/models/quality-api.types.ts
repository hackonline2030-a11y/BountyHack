export type QualityCriterionStatusWire = 'draft' | 'published' | 'archived';

export type QualityCategoryWire = {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type QualityTargetTypeWire = {
  id: string;
  code: string;
  label: string;
  requiresTargetRef: boolean;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type QualityCriterionWire = {
  id: string;
  code: string;
  title: string;
  explanation: string | null;
  status: QualityCriterionStatusWire;
  categoryId: string | null;
  category: QualityCategoryWire | null;
  createdByUserId: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  targetTypes: QualityTargetTypeWire[];
};

export type QualityDistributionWire = {
  id: string;
  criterionId: string;
  targetTypeId: string;
  targetType: QualityTargetTypeWire;
  targetRefId: string | null;
  distributedByUserId: string;
  distributedAt: string;
  criterion?: QualityCriterionWire;
  checks: QualityCheckWire[];
};

export type QualityCheckWire = {
  id: string;
  distributionId: string;
  context: string;
  checked: boolean;
  checkedByUserId: string | null;
  checkedAt: string | null;
  updatedAt: string;
};

export type InstanceCriteriaWire = {
  distribution: QualityDistributionWire;
  criterion: QualityCriterionWire;
  checks: QualityCheckWire[];
};

export type CreateQualityCategoryInput = {
  name: string;
  color: string;
  sortOrder?: number;
};

export type UpdateQualityCategoryInput = {
  name?: string;
  color?: string;
  sortOrder?: number;
};

export type CreateQualityTargetTypeInput = {
  code: string;
  label: string;
  requiresTargetRef?: boolean;
  sortOrder?: number;
  isActive?: boolean;
};

export type UpdateQualityTargetTypeInput = {
  label?: string;
  requiresTargetRef?: boolean;
  sortOrder?: number;
  isActive?: boolean;
};

export type CreateQualityCriterionInput = {
  code: string;
  title: string;
  explanation?: string | null;
  categoryId?: string | null;
  targetTypeIds: string[];
};

export type UpdateQualityCriterionInput = {
  title?: string;
  explanation?: string | null;
  categoryId?: string | null;
  targetTypeIds?: string[];
};

export type CreateQualityDistributionInput = {
  criterionId: string;
  targetTypeCode: string;
  targetRefId?: string | null;
  contexts: string[];
};

export type UpdateQualityDistributionInput = {
  targetRefId?: string | null;
};

export type UpsertQualityCheckInput = {
  distributionId: string;
  context: string;
  checked: boolean;
};
