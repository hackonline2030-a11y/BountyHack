import { Injectable } from '@nestjs/common';
import { DraftStep } from '../../../generated/prisma/enums';
import { PrismaService } from '../../../core/infrastructure/database/prisma/prisma.service';
import { ReportDraftPrismaMapper } from '../../adapters/postgre-prisma/report-draft-prisma.mapper';
import type { AdminReportDraftAttachmentRowWire } from '../../models/report-draft-attachment-admin.types';

function reportTitleFromMetaPayload(payload: unknown): string {
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    return '';
  }
  const title = (payload as Record<string, unknown>).reportTitle;
  return typeof title === 'string' ? title.trim() : '';
}

@Injectable()
export class ListAllReportDraftAttachmentsQuery {
  constructor(private readonly prisma: PrismaService) {}

  async execute(): Promise<AdminReportDraftAttachmentRowWire[]> {
    const rows = await this.prisma.reportDraftAttachment.findMany({
      orderBy: { uploadedAt: 'desc' },
      include: {
        reportDraftStep: {
          include: {
            reportDraft: {
              include: {
                steps: true,
                reportTeam: true,
              },
            },
          },
        },
      },
    });

    return rows.map((row) => {
      const draft = row.reportDraftStep.reportDraft;
      const metaStep = draft.steps.find((s) => s.step === DraftStep.META);
      const reportTitle = metaStep
        ? reportTitleFromMetaPayload(metaStep.payload)
        : '';
      return {
        attachmentId: row.id,
        reportDraftId: draft.id,
        reportTitle: reportTitle || draft.id,
        reportTeamLabel: draft.reportTeam?.label ?? null,
        stepKey: ReportDraftPrismaMapper.stateKeyFromDraftStep(row.reportDraftStep.step),
        storageKey: row.storageKey,
        filename: row.filename,
        mimeType: row.mimeType,
        sizeBytes: row.sizeBytes,
        uploadedAt: row.uploadedAt.toISOString(),
        uploadedBy: row.uploadedBy,
      };
    });
  }
}
