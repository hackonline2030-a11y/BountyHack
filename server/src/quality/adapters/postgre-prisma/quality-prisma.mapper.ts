import type { QualityCriterionStatus } from '../../../generated/prisma/enums';
import type {
  QualityCategoryWire,
  QualityCheckWire,
  QualityCriterionStatusWire,
  QualityCriterionWire,
  QualityDistributionWire,
  QualityTargetTypeWire,
} from '../../models/quality-api.types';

type CategoryRow = {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

type TargetTypeRow = {
  id: string;
  code: string;
  label: string;
  requiresTargetRef: boolean;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type CriterionRow = {
  id: string;
  code: string;
  title: string;
  explanation: string | null;
  status: QualityCriterionStatus;
  categoryId: string | null;
  createdByUserId: string;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  category?: CategoryRow | null;
  targetTypeLinks?: { targetType: TargetTypeRow }[];
};

type CheckRow = {
  id: string;
  distributionId: string;
  context: string;
  checked: boolean;
  checkedByUserId: string | null;
  checkedAt: Date | null;
  updatedAt: Date;
};

type DistributionRow = {
  id: string;
  criterionId: string;
  targetTypeId: string;
  targetRefId: string | null;
  distributedByUserId: string;
  distributedAt: Date;
  targetType: TargetTypeRow;
  criterion?: CriterionRow;
  checks?: CheckRow[];
};

const STATUS_TO_WIRE: Record<QualityCriterionStatus, QualityCriterionStatusWire> =
  {
    DRAFT: 'draft',
    PUBLISHED: 'published',
    ARCHIVED: 'archived',
  };

export class QualityPrismaMapper {
  static categoryToWire(row: CategoryRow): QualityCategoryWire {
    return {
      id: row.id,
      name: row.name,
      color: row.color,
      sortOrder: row.sortOrder,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  static targetTypeToWire(row: TargetTypeRow): QualityTargetTypeWire {
    return {
      id: row.id,
      code: row.code,
      label: row.label,
      requiresTargetRef: row.requiresTargetRef,
      sortOrder: row.sortOrder,
      isActive: row.isActive,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  static criterionToWire(row: CriterionRow): QualityCriterionWire {
    const targetTypes =
      row.targetTypeLinks?.map((l) =>
        QualityPrismaMapper.targetTypeToWire(l.targetType),
      ) ?? [];
    return {
      id: row.id,
      code: row.code,
      title: row.title,
      explanation: row.explanation,
      status: STATUS_TO_WIRE[row.status],
      categoryId: row.categoryId,
      category: row.category
        ? QualityPrismaMapper.categoryToWire(row.category)
        : null,
      createdByUserId: row.createdByUserId,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      targetTypes,
    };
  }

  static checkToWire(row: CheckRow): QualityCheckWire {
    return {
      id: row.id,
      distributionId: row.distributionId,
      context: row.context,
      checked: row.checked,
      checkedByUserId: row.checkedByUserId,
      checkedAt: row.checkedAt?.toISOString() ?? null,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  static distributionToWire(row: DistributionRow): QualityDistributionWire {
    return {
      id: row.id,
      criterionId: row.criterionId,
      targetTypeId: row.targetTypeId,
      targetType: QualityPrismaMapper.targetTypeToWire(row.targetType),
      targetRefId: row.targetRefId,
      distributedByUserId: row.distributedByUserId,
      distributedAt: row.distributedAt.toISOString(),
      criterion: row.criterion
        ? QualityPrismaMapper.criterionToWire(row.criterion)
        : undefined,
      checks: row.checks?.map((c) => QualityPrismaMapper.checkToWire(c)) ?? [],
    };
  }
}
