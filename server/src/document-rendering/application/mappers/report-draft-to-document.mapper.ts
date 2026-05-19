import type { ReportDraftWire } from '../../../report-draft/models/report-draft-api.types';
import { mapFrozenContentToDocument } from './frozen-content-to-document.mapper';
import type { FrozenReportDocumentReadModel } from '../read-models/frozen-report-document.read-model';

/** Maps a validated `ReportDraftWire` directly to the PDF/EJS view model (no `reports` table). */
export function mapReportDraftWireToDocument(
  draft: ReportDraftWire,
  locale?: string,
): FrozenReportDocumentReadModel {
  return mapFrozenContentToDocument({
    reportId: draft.id,
    reportStatus: draft.aggregateStatus,
    hunterId: draft.hunterId,
    frozenContent: {
      schemaVersion: 1,
      sourceDraftId: draft.id,
      draftVersion: draft.version,
      hunterId: draft.hunterId,
      frozenAt: draft.updatedAt,
      steps: {
        meta: draft.meta,
        description: draft.description,
        collection: draft.collection,
        exploitation: draft.exploitation,
        proofOfConcept: draft.proofOfConcept,
        risks: draft.risks,
        remediation: draft.remediation,
        final: draft.final,
      },
      reportTeam: draft.reportTeam ?? null,
    },
    ...(locale !== undefined ? { locale } : {}),
  });
}
