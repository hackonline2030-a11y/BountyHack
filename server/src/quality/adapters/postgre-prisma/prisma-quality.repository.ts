import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { QualityCriterionStatus } from '../../../generated/prisma/enums';
import { PrismaService } from '../../../core/infrastructure/database/prisma/prisma.service';
import type {
  CreateQualityCategoryInput,
  CreateQualityCriterionInput,
  CreateQualityDistributionInput,
  CreateQualityTargetTypeInput,
  QualityCategoryWire,
  QualityCheckWire,
  QualityCriterionWire,
  QualityDistributionWire,
  QualityTargetTypeWire,
  UpdateQualityCategoryInput,
  UpdateQualityCriterionInput,
  UpdateQualityDistributionInput,
  UpdateQualityTargetTypeInput,
} from '../../models/quality-api.types';
import {
  assertValidCriterionCode,
  normalizeCriterionCode,
} from '../../application/utils/criterion-code.util';
import { assertExplanationWordLimit } from '../../application/utils/word-count.util';
import type { IQualityRepository } from '../../ports/quality-repository.interface';
import { QualityPrismaMapper } from './quality-prisma.mapper';

const criterionInclude = {
  category: true,
  targetTypeLinks: { include: { targetType: true } },
} as const;

const distributionInclude = {
  targetType: true,
  criterion: { include: criterionInclude },
  checks: true,
} as const;

const STATUS_MAP: Record<
  'draft' | 'published' | 'archived',
  QualityCriterionStatus
> = {
  draft: QualityCriterionStatus.DRAFT,
  published: QualityCriterionStatus.PUBLISHED,
  archived: QualityCriterionStatus.ARCHIVED,
};

@Injectable()
export class PrismaQualityRepository implements IQualityRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listCategories(): Promise<QualityCategoryWire[]> {
    const rows = await this.prisma.qualityCriterionCategory.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return rows.map((r) => QualityPrismaMapper.categoryToWire(r));
  }

  async findCategoryById(id: string): Promise<QualityCategoryWire | null> {
    const row = await this.prisma.qualityCriterionCategory.findUnique({
      where: { id },
    });
    return row ? QualityPrismaMapper.categoryToWire(row) : null;
  }

  async createCategory(
    input: CreateQualityCategoryInput,
  ): Promise<QualityCategoryWire> {
    const row = await this.prisma.qualityCriterionCategory.create({
      data: {
        id: randomUUID(),
        name: input.name.trim(),
        color: input.color.trim(),
        sortOrder: input.sortOrder ?? 0,
      },
    });
    return QualityPrismaMapper.categoryToWire(row);
  }

  async updateCategory(
    id: string,
    input: UpdateQualityCategoryInput,
  ): Promise<QualityCategoryWire> {
    await this.assertCategoryExists(id);
    const row = await this.prisma.qualityCriterionCategory.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.color !== undefined ? { color: input.color.trim() } : {}),
        ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      },
    });
    return QualityPrismaMapper.categoryToWire(row);
  }

  async deleteCategory(id: string): Promise<void> {
    await this.assertCategoryExists(id);
    await this.prisma.qualityCriterionCategory.delete({ where: { id } });
  }

  async listTargetTypes(activeOnly = false): Promise<QualityTargetTypeWire[]> {
    const rows = await this.prisma.qualityCriterionTargetType.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
    });
    return rows.map((r) => QualityPrismaMapper.targetTypeToWire(r));
  }

  async findTargetTypeById(id: string): Promise<QualityTargetTypeWire | null> {
    const row = await this.prisma.qualityCriterionTargetType.findUnique({
      where: { id },
    });
    return row ? QualityPrismaMapper.targetTypeToWire(row) : null;
  }

  async findTargetTypeByCode(code: string): Promise<QualityTargetTypeWire | null> {
    const row = await this.prisma.qualityCriterionTargetType.findUnique({
      where: { code: code.trim() },
    });
    return row ? QualityPrismaMapper.targetTypeToWire(row) : null;
  }

  async createTargetType(
    input: CreateQualityTargetTypeInput,
  ): Promise<QualityTargetTypeWire> {
    const code = input.code.trim().toLowerCase().replace(/\s+/g, '_');
    if (!/^[a-z][a-z0-9_]{1,48}$/.test(code)) {
      throw new BadRequestException(
        'Target type code must be lowercase snake_case (2–49 chars)',
      );
    }
    const row = await this.prisma.qualityCriterionTargetType.create({
      data: {
        id: randomUUID(),
        code,
        label: input.label.trim(),
        requiresTargetRef: input.requiresTargetRef ?? true,
        sortOrder: input.sortOrder ?? 0,
        isActive: input.isActive ?? true,
      },
    });
    return QualityPrismaMapper.targetTypeToWire(row);
  }

  async updateTargetType(
    id: string,
    input: UpdateQualityTargetTypeInput,
  ): Promise<QualityTargetTypeWire> {
    await this.assertTargetTypeExists(id);
    const row = await this.prisma.qualityCriterionTargetType.update({
      where: { id },
      data: {
        ...(input.label !== undefined ? { label: input.label.trim() } : {}),
        ...(input.requiresTargetRef !== undefined
          ? { requiresTargetRef: input.requiresTargetRef }
          : {}),
        ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
    });
    return QualityPrismaMapper.targetTypeToWire(row);
  }

  async deleteTargetType(id: string): Promise<void> {
    await this.assertTargetTypeExists(id);
    const usage = await this.countTargetTypeUsages(id);
    if (usage.linkCount > 0 || usage.distributionCount > 0) {
      throw new ConflictException(
        'Cannot delete target type while criteria links or distributions exist',
      );
    }
    await this.prisma.qualityCriterionTargetType.delete({ where: { id } });
  }

  async countTargetTypeUsages(targetTypeId: string): Promise<{
    linkCount: number;
    distributionCount: number;
  }> {
    const [linkCount, distributionCount] = await Promise.all([
      this.prisma.qualityCriterionTargetTypeLink.count({
        where: { targetTypeId },
      }),
      this.prisma.qualityCriterionDistribution.count({
        where: { targetTypeId },
      }),
    ]);
    return { linkCount, distributionCount };
  }

  async listCriteriaByStatus(
    status: 'draft' | 'published' | 'archived',
    createdByUserId?: string,
  ): Promise<QualityCriterionWire[]> {
    const rows = await this.prisma.qualityCriterion.findMany({
      where: {
        status: STATUS_MAP[status],
        ...(createdByUserId ? { createdByUserId } : {}),
      },
      include: criterionInclude,
      orderBy: [{ updatedAt: 'desc' }, { code: 'asc' }],
    });
    return rows.map((r) => QualityPrismaMapper.criterionToWire(r));
  }

  async findCriterionById(id: string): Promise<QualityCriterionWire | null> {
    const row = await this.prisma.qualityCriterion.findUnique({
      where: { id },
      include: criterionInclude,
    });
    return row ? QualityPrismaMapper.criterionToWire(row) : null;
  }

  async findCriterionByCode(code: string): Promise<QualityCriterionWire | null> {
    const row = await this.prisma.qualityCriterion.findUnique({
      where: { code: normalizeCriterionCode(code) },
      include: criterionInclude,
    });
    return row ? QualityPrismaMapper.criterionToWire(row) : null;
  }

  async createCriterion(
    createdByUserId: string,
    input: CreateQualityCriterionInput,
  ): Promise<QualityCriterionWire> {
    assertValidCriterionCode(input.code);
    assertExplanationWordLimit(input.explanation);
    const code = normalizeCriterionCode(input.code);
    await this.assertUniqueCriterionCode(code);
    await this.assertTargetTypeIdsExist(input.targetTypeIds);
    if (input.categoryId) {
      await this.assertCategoryExists(input.categoryId);
    }

    const row = await this.prisma.qualityCriterion.create({
      data: {
        id: randomUUID(),
        code,
        title: input.title.trim(),
        explanation: input.explanation?.trim() || null,
        categoryId: input.categoryId ?? null,
        createdByUserId,
        targetTypeLinks: {
          create: input.targetTypeIds.map((targetTypeId) => ({
            targetTypeId,
          })),
        },
      },
      include: criterionInclude,
    });
    return QualityPrismaMapper.criterionToWire(row);
  }

  async updateCriterion(
    id: string,
    input: UpdateQualityCriterionInput,
  ): Promise<QualityCriterionWire> {
    const existing = await this.prisma.qualityCriterion.findUnique({
      where: { id },
    });
    if (existing === null) {
      throw new NotFoundException('Criterion not found');
    }
    assertExplanationWordLimit(input.explanation);
    if (input.categoryId) {
      await this.assertCategoryExists(input.categoryId);
    }
    if (input.targetTypeIds) {
      await this.assertTargetTypeIdsExist(input.targetTypeIds);
      const distCount = await this.prisma.qualityCriterionDistribution.count({
        where: { criterionId: id },
      });
      if (distCount > 0) {
        throw new ConflictException(
          'Cannot change target types while distributions exist; revoke distributions first',
        );
      }
    }

    await this.prisma.$transaction(async (tx) => {
      if (input.targetTypeIds) {
        await tx.qualityCriterionTargetTypeLink.deleteMany({
          where: { criterionId: id },
        });
        if (input.targetTypeIds.length > 0) {
          await tx.qualityCriterionTargetTypeLink.createMany({
            data: input.targetTypeIds.map((targetTypeId) => ({
              criterionId: id,
              targetTypeId,
            })),
          });
        }
      }
      await tx.qualityCriterion.update({
        where: { id },
        data: {
          ...(input.title !== undefined ? { title: input.title.trim() } : {}),
          ...(input.explanation !== undefined
            ? { explanation: input.explanation?.trim() || null }
            : {}),
          ...(input.categoryId !== undefined
            ? { categoryId: input.categoryId }
            : {}),
        },
      });
    });

    const row = await this.prisma.qualityCriterion.findUniqueOrThrow({
      where: { id },
      include: criterionInclude,
    });
    return QualityPrismaMapper.criterionToWire(row);
  }

  async deleteCriterion(id: string): Promise<void> {
    await this.assertCriterionExists(id);
    await this.prisma.qualityCriterion.delete({ where: { id } });
  }

  async publishCriterion(id: string): Promise<QualityCriterionWire> {
    const row = await this.prisma.qualityCriterion.findUnique({
      where: { id },
      include: { targetTypeLinks: true },
    });
    if (row === null) {
      throw new NotFoundException('Criterion not found');
    }
    if (row.status !== QualityCriterionStatus.DRAFT) {
      throw new BadRequestException('Only draft criteria can be published');
    }
    if (row.targetTypeLinks.length === 0) {
      throw new BadRequestException(
        'Assign at least one target type before publishing',
      );
    }
    const updated = await this.prisma.qualityCriterion.update({
      where: { id },
      data: {
        status: QualityCriterionStatus.PUBLISHED,
        publishedAt: new Date(),
      },
      include: criterionInclude,
    });
    return QualityPrismaMapper.criterionToWire(updated);
  }

  async archiveCriterion(id: string): Promise<QualityCriterionWire> {
    await this.assertCriterionExists(id);
    const updated = await this.prisma.qualityCriterion.update({
      where: { id },
      data: { status: QualityCriterionStatus.ARCHIVED },
      include: criterionInclude,
    });
    return QualityPrismaMapper.criterionToWire(updated);
  }

  async findDistributionById(
    id: string,
  ): Promise<QualityDistributionWire | null> {
    const row = await this.prisma.qualityCriterionDistribution.findUnique({
      where: { id },
      include: distributionInclude,
    });
    return row ? QualityPrismaMapper.distributionToWire(row) : null;
  }

  async createDistribution(
    distributedByUserId: string,
    input: CreateQualityDistributionInput,
    targetTypeId: string,
  ): Promise<QualityDistributionWire> {
    const criterion = await this.prisma.qualityCriterion.findUnique({
      where: { id: input.criterionId },
      include: { targetTypeLinks: true },
    });
    if (criterion === null) {
      throw new NotFoundException('Criterion not found');
    }
    if (criterion.status !== QualityCriterionStatus.PUBLISHED) {
      throw new BadRequestException('Only published criteria can be distributed');
    }
    const linked = criterion.targetTypeLinks.some(
      (l) => l.targetTypeId === targetTypeId,
    );
    if (!linked) {
      throw new BadRequestException(
        'Criterion is not eligible for this target type',
      );
    }

    const targetRefId = input.targetRefId?.trim() || null;
    const contexts = [...new Set(input.contexts.map((c) => c.trim()))];
    if (contexts.length === 0) {
      throw new BadRequestException('At least one check context is required');
    }

    try {
      const row = await this.prisma.qualityCriterionDistribution.create({
        data: {
          id: randomUUID(),
          criterionId: input.criterionId,
          targetTypeId,
          targetRefId,
          distributedByUserId,
          checks: {
            create: contexts.map((context) => ({
              id: randomUUID(),
              context,
            })),
          },
        },
        include: distributionInclude,
      });
      return QualityPrismaMapper.distributionToWire(row);
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code: string }).code === 'P2002'
      ) {
        throw new ConflictException(
          'This criterion is already distributed to this target',
        );
      }
      throw err;
    }
  }

  async updateDistribution(
    id: string,
    input: UpdateQualityDistributionInput,
  ): Promise<QualityDistributionWire> {
    const existing = await this.prisma.qualityCriterionDistribution.findUnique({
      where: { id },
      include: { targetType: true },
    });
    if (existing === null) {
      throw new NotFoundException('Distribution not found');
    }
    if (input.targetRefId !== undefined) {
      const targetType = existing.targetType;
      const ref = input.targetRefId?.trim() || null;
      if (targetType.requiresTargetRef && !ref) {
        throw new BadRequestException('targetRefId is required for this target type');
      }
      if (!targetType.requiresTargetRef && ref) {
        throw new BadRequestException(
          'targetRefId must be omitted for this target type',
        );
      }
    }
    try {
      const row = await this.prisma.qualityCriterionDistribution.update({
        where: { id },
        data: {
          ...(input.targetRefId !== undefined
            ? { targetRefId: input.targetRefId?.trim() || null }
            : {}),
        },
        include: distributionInclude,
      });
      return QualityPrismaMapper.distributionToWire(row);
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code: string }).code === 'P2002'
      ) {
        throw new ConflictException(
          'Distribution conflicts with an existing row for this target',
        );
      }
      throw err;
    }
  }

  async deleteDistribution(id: string): Promise<void> {
    await this.prisma.qualityCriterionDistribution.delete({ where: { id } });
  }

  async listDistributionsForInstance(
    targetTypeCode: string,
    targetRefId: string | null,
  ): Promise<QualityDistributionWire[]> {
    const targetType = await this.findTargetTypeByCode(targetTypeCode);
    if (targetType === null) {
      throw new NotFoundException('Target type not found');
    }
    const ref = targetRefId?.trim() || null;
    const rows = await this.prisma.qualityCriterionDistribution.findMany({
      where: {
        targetTypeId: targetType.id,
        targetRefId: ref,
        criterion: { status: QualityCriterionStatus.PUBLISHED },
      },
      include: distributionInclude,
      orderBy: { distributedAt: 'asc' },
    });
    return rows.map((r) => QualityPrismaMapper.distributionToWire(r));
  }

  async upsertCheck(
    distributionId: string,
    context: string,
    checked: boolean,
    checkedByUserId: string,
  ): Promise<QualityCheckWire> {
    const row = await this.prisma.qualityCriterionCheck.upsert({
      where: {
        distributionId_context: {
          distributionId,
          context: context.trim(),
        },
      },
      create: {
        id: randomUUID(),
        distributionId,
        context: context.trim(),
        checked,
        checkedByUserId,
        checkedAt: checked ? new Date() : null,
      },
      update: {
        checked,
        checkedByUserId,
        checkedAt: checked ? new Date() : null,
      },
    });
    return QualityPrismaMapper.checkToWire(row);
  }

  private async assertCategoryExists(id: string): Promise<void> {
    const row = await this.prisma.qualityCriterionCategory.findUnique({
      where: { id },
    });
    if (row === null) {
      throw new NotFoundException('Category not found');
    }
  }

  private async assertTargetTypeExists(id: string): Promise<void> {
    const row = await this.prisma.qualityCriterionTargetType.findUnique({
      where: { id },
    });
    if (row === null) {
      throw new NotFoundException('Target type not found');
    }
  }

  private async assertCriterionExists(id: string): Promise<void> {
    const row = await this.prisma.qualityCriterion.findUnique({ where: { id } });
    if (row === null) {
      throw new NotFoundException('Criterion not found');
    }
  }

  private async assertUniqueCriterionCode(code: string): Promise<void> {
    const existing = await this.prisma.qualityCriterion.findUnique({
      where: { code },
    });
    if (existing) {
      throw new ConflictException(`Criterion code ${code} already exists`);
    }
  }

  private async assertTargetTypeIdsExist(ids: string[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }
    const count = await this.prisma.qualityCriterionTargetType.count({
      where: { id: { in: ids } },
    });
    if (count !== ids.length) {
      throw new BadRequestException('One or more target types are invalid');
    }
  }
}
