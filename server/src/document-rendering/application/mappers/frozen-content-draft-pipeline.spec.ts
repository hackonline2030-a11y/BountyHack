import { buildFrozenContentFromDraft } from '../../../report-draft/application/admin/promote-draft-to-report';
import type { ReportDraftWire } from '../../../report-draft/models/report-draft-api.types';
import { mapFrozenContentToDocument } from './frozen-content-to-document.mapper';
import { mapReportDraftWireToDocument } from './report-draft-to-document.mapper';

function approvedStep(
  payload: Record<string, unknown>,
): ReportDraftWire['collection'] {
  return {
    payload,
    attachments: [],
    status: 'approved',
    currentRound: 2,
    assignedReviewerRole: null,
  };
}

function bucketVaultDraft(): ReportDraftWire {
  return {
    id: 'bbbbbbbb-0001-4000-8000-000000000001',
    hunterId: 'hunter-1',
    version: 36,
    aggregateStatus: 'published',
    meta: approvedStep({
      reportTitle: 'Rapport challenge n°50 Dojo YesWeHack',
      bugType: 'CWE-22',
      scopeSlug: 'dojo-50',
    }),
    description: approvedStep({
      scope: 'U',
      confidentiality: 'H',
      sectionBlocs: [
        { body: 'Le challenge Bucket Vault vise le fichier super_secret.txt.', heading: '', subheading: '' },
      ],
    }),
    collection: approvedStep({
      sectionBlocs: [
        { body: 'Analyse du code de setup et des endpoints sign/download.', heading: '', subheading: '' },
      ],
    }),
    exploitation: approvedStep({
      sectionBlocs: [
        { body: 'Path traversal via sanitizeFilename() et caractère de contrôle.', heading: '', subheading: '' },
      ],
    }),
    proofOfConcept: approvedStep({
      sectionBlocs: [
        { body: 'Filename : public/.\\n./super_secret.txt puis download.', heading: '', subheading: '' },
      ],
    }),
    risks: approvedStep({
      sectionBlocs: [
        { body: 'Lecture de fichier arbitraire et fuite de données.', heading: '', subheading: '' },
      ],
    }),
    remediation: approvedStep({
      sectionBlocs: [
        { body: 'Revalider .. après assainissement du chemin.', heading: '', subheading: '' },
      ],
    }),
    final: approvedStep({ sectionBlocs: [] }),
    createdAt: '2026-05-17T13:26:15.306Z',
    updatedAt: '2026-05-17T21:08:25.731Z',
    reportTeam: { label: 'Bucket Vault', members: [] },
  };
}

describe('published draft → PDF document', () => {
  it('maps live draft wire directly to EJS view model', () => {
    const draft = bucketVaultDraft();
    const doc = mapReportDraftWireToDocument(draft);

    expect(doc.title).toBe('Rapport challenge n°50 Dojo YesWeHack');
    expect(doc.sections.map((s) => s.key)).toEqual([
      'description',
      'collection',
      'exploitation',
      'proofOfConcept',
      'risks',
      'remediation',
    ]);
  });

  it('maps legacy frozen snapshot shape (frozen_content builder)', () => {
    const draft = bucketVaultDraft();
    const frozen = buildFrozenContentFromDraft(draft, new Date('2026-05-17T21:08:25.731Z'));

    expect(frozen.steps).toBeDefined();
    const steps = frozen.steps as Record<string, { payload: Record<string, unknown> }>;
    expect(steps.collection.payload.sectionBlocs).toHaveLength(1);

    const doc = mapFrozenContentToDocument({
      reportId: draft.id,
      reportStatus: 'published',
      hunterId: draft.hunterId,
      frozenContent: frozen,
    });

    expect(doc.title).toBe('Rapport challenge n°50 Dojo YesWeHack');
    expect(doc.sections.map((s) => s.key)).toEqual([
      'description',
      'collection',
      'exploitation',
      'proofOfConcept',
      'risks',
      'remediation',
    ]);
  });
});
