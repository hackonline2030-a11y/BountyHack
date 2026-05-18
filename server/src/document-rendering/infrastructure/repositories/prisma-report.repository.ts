import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../core/infrastructure/database/prisma/prisma.service';
import {
  ReportDataInvalidError,
  ReportIdInvalidError,
  ReportNotFoundError,
} from '../../application/errors/pdf-application.errors';
import { mapFrozenContentToDocument } from '../../application/mappers/frozen-content-to-document.mapper';
import type {
  IReportRepository,
  ReportListItemReadModel,
} from '../../application/ports/report-repository.port';
import { ReportTemplate } from '../../domain/entities/report-template.entity';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class PrismaReportRepository implements IReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listReports(): Promise<ReportListItemReadModel[]> {
    const rows = await this.prisma.report.findMany({
      where: {
        frozenContent: { not: Prisma.DbNull },
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        status: true,
        sourceDraftId: true,
        updatedAt: true,
        frozenContent: true,
        hunterId: true,
      },
    });

    return rows.map((row) => {
      let title = `Report ${row.id.slice(0, 8)}`;
      try {
        const doc = mapFrozenContentToDocument({
          reportId: row.id,
          reportStatus: row.status,
          hunterId: row.hunterId,
          frozenContent: row.frozenContent,
        });
        title = doc.title;
      } catch {
        // list view: fall back to short id
      }
      return {
        id: row.id,
        status: row.status,
        title,
        sourceDraftId: row.sourceDraftId,
        updatedAt: row.updatedAt.toISOString(),
      };
    });
  }

  async getReportTemplateData(
    reportId: string,
    locale?: string,
  ): Promise<ReportTemplate> {
    const id = typeof reportId === 'string' ? reportId.trim() : '';
    if (!UUID_PATTERN.test(id)) {
      throw new ReportIdInvalidError(reportId);
    }

    const row = await this.prisma.report.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        hunterId: true,
        frozenContent: true,
      },
    });

    if (!row || row.frozenContent === null) {
      throw new ReportNotFoundError(id);
    }

    try {
      const readModel = mapFrozenContentToDocument({
        reportId: row.id,
        reportStatus: row.status,
        hunterId: row.hunterId,
        frozenContent: row.frozenContent,
        ...(locale !== undefined ? { locale } : {}),
      });
      return ReportTemplate.create(readModel);
    } catch (error) {
      if (error instanceof ReportDataInvalidError) {
        throw error;
      }
      throw new ReportDataInvalidError(
        `Cannot build PDF document for report '${id}': ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
