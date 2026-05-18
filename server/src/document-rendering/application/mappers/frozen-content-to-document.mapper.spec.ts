import { mapFrozenContentToDocument } from './frozen-content-to-document.mapper';

describe('mapFrozenContentToDocument', () => {
  const frozenContent = {
    schemaVersion: 1,
    sourceDraftId: 'draft-1',
    draftVersion: 36,
    hunterId: 'hunter-1',
    frozenAt: '2026-05-17T21:08:25.731Z',
    reportTeam: {
      label: 'Rapport SQL Injection (dev seed)',
      members: [
        { userId: 'h1', displayName: 'dev-hunter-1', role: 'hunter' },
      ],
    },
    steps: {
      meta: {
        payload: {
          reportTitle: 'Rapport challenge n°50',
          scopeSlug: 'dojo-50',
          bugType: 'CWE-89',
          endpoint: 'GET /?action=generate',
        },
      },
      description: {
        payload: {
          attackVector: 'N',
          confidentiality: 'L',
        },
      },
      collection: {
        payload: {
          sectionBlocs: [{ body: 'collecte', heading: '', subheading: '' }],
        },
      },
    },
  };

  it('maps flat snapshot (step keys at root, no steps wrapper)', () => {
    const flat = {
      schemaVersion: 1,
      sourceDraftId: 'draft-1',
      draftVersion: 36,
      hunterId: 'hunter-1',
      frozenAt: '2026-05-17T21:08:25.731Z',
      meta: frozenContent.steps.meta,
      description: frozenContent.steps.description,
      collection: frozenContent.steps.collection,
    };

    const doc = mapFrozenContentToDocument({
      reportId: 'report-1',
      reportStatus: 'PENDING',
      hunterId: 'hunter-1',
      frozenContent: flat,
    });

    expect(doc.title).toBe('Rapport challenge n°50');
    expect(doc.sections[0]?.key).toBe('collection');
  });

  it('maps frozen_content to EJS view model', () => {
    const doc = mapFrozenContentToDocument({
      reportId: 'report-1',
      reportStatus: 'PENDING',
      hunterId: 'hunter-1',
      frozenContent,
    });

    expect(doc.title).toBe('Rapport challenge n°50');
    expect(doc.meta.scopeSlug).toBe('dojo-50');
    expect(doc.sections).toHaveLength(1);
    expect(doc.sections[0]?.key).toBe('collection');
    expect(doc.reportTeam?.label).toBe('Rapport SQL Injection (dev seed)');
    expect(doc.authorName).toBe('dev-hunter-1');
    expect(doc.tableOfContents[0]).toEqual({
      label: 'Rapport challenge n°50',
      page: 1,
      bold: true,
    });
    expect(doc.tableOfContents[1]?.page).toBe(2);
    expect(doc.tableOfContents[1]?.label).toMatch(/Collectes d.informations :/);
  });

  it('uses meta reportTitle for PDF title, not team label', () => {
    const doc = mapFrozenContentToDocument({
      reportId: 'report-1',
      reportStatus: 'PENDING',
      hunterId: 'hunter-1',
      frozenContent: {
        ...frozenContent,
        steps: {
          meta: { payload: { reportTitle: '' } },
          collection: frozenContent.steps.collection,
        },
      },
    });

    expect(doc.title).toBe('Rapport de sécurité');
    expect(doc.title).not.toBe('Rapport SQL Injection (dev seed)');
  });

  it('omits CVSS-only description step from PDF chapters', () => {
    const doc = mapFrozenContentToDocument({
      reportId: 'report-1',
      reportStatus: 'PENDING',
      hunterId: 'hunter-1',
      frozenContent,
    });

    expect(doc.sections.every((s) => s.key !== 'description')).toBe(true);
  });
});
