export type QualityCriterionStatus = "draft" | "published" | "archived";

export type QualityCategory = {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
};

export type QualityTargetType = {
  id: string;
  code: string;
  label: string;
  requiresTargetRef: boolean;
  sortOrder: number;
  isActive: boolean;
};

export type QualityCriterion = {
  id: string;
  code: string;
  title: string;
  explanation: string | null;
  status: QualityCriterionStatus;
  categoryId: string | null;
  category: QualityCategory | null;
  createdByUserId: string;
  publishedAt: string | null;
  targetTypes: QualityTargetType[];
};

export type QualityCheck = {
  id: string;
  distributionId: string;
  context: string;
  checked: boolean;
  checkedByUserId: string | null;
  checkedAt: string | null;
};

export type QualityDistribution = {
  id: string;
  criterionId: string;
  targetTypeId: string;
  targetType: QualityTargetType;
  targetRefId: string | null;
  distributedByUserId: string;
  distributedAt: string;
  criterion?: QualityCriterion;
  checks: QualityCheck[];
};

export const REPORT_QUALITY_CONTEXTS = [
  "submission_review",
  "global_submission_review",
] as const;

export type ReportQualityContext = (typeof REPORT_QUALITY_CONTEXTS)[number];

/** Report draft row for QC distribution picker (DB id + display labels). */
export type QualityReportDraftTarget = {
  id: string;
  reportTitle: string;
  teamLabel: string | null;
  aggregateStatus: string;
  updatedAt: string;
};
