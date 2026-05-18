import { Injectable } from '@nestjs/common';
import type { AggregateStatusWire } from '../../../report-draft/models/report-draft-api.types';
import { IReportDraftRepository } from '../../../report-draft/ports/report-draft-repository.interface';
import {
  ReportDataInvalidError,
  ReportIdInvalidError,
  ReportNotFoundError,
} from '../../application/errors/pdf-application.errors';
import { mapReportDraftWireToDocument } from '../../application/mappers/report-draft-to-document.mapper';
import type {
  IReportDraftDocumentRepository,
  PublishedDraftListItemReadModel,
} from '../../application/ports/report-draft-document-repository.port';
import { ReportTemplate } from '../../domain/entities/report-template.entity';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const PUBLISHED_WIRE_STATUSES = new Set<AggregateStatusWire>([
  'published',
  'submitted-to-program',
]);

@Injectable()
export class PrismaReportDraftDocumentRepository
  implements IReportDraftDocumentRepository
{
  constructor(private readonly reportDraftRepository: IReportDraftRepository) {}

  async listPublishedDrafts(): Promise<PublishedDraftListItemReadModel[]> {
    const drafts = await this.reportDraftRepository.findPublished();
    return drafts.map((draft) => {
      let title = `Draft ${draft.id.slice(0, 8)}`;
      try {
        title = mapReportDraftWireToDocument(draft).title;
      } catch {
        // fall back to short id
      }
      return {
        id: draft.id,
        title,
        status: draft.aggregateStatus,
        updatedAt: draft.updatedAt,
      };
    });
  }

  async getDocumentTemplateData(
    draftId: string,
    locale?: string,
  ): Promise<ReportTemplate> {
    const id = typeof draftId === 'string' ? draftId.trim() : '';
    if (!UUID_PATTERN.test(id)) {
      throw new ReportIdInvalidError(draftId);
    }

    const draft = await this.reportDraftRepository.findById(id);
    if (!draft) {
      throw new ReportNotFoundError(id);
    }

    if (!PUBLISHED_WIRE_STATUSES.has(draft.aggregateStatus)) {
      throw new ReportDataInvalidError(
        `Report draft '${id}' is not published (status: ${draft.aggregateStatus}).`,
      );
    }

    try {
      const readModel = mapReportDraftWireToDocument(
        draft,
        ...(locale !== undefined ? [locale] : []),
      );
      return ReportTemplate.create(readModel);
    } catch (error) {
      if (error instanceof ReportDataInvalidError) {
        throw error;
      }
      throw new ReportDataInvalidError(
        `Cannot build PDF document for draft '${id}': ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
