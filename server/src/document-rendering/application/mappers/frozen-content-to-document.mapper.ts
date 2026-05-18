import { ReportDataInvalidError } from '../errors/pdf-application.errors';
import type {
  FrozenReportDocumentReadModel,
  FrozenReportSectionReadModel,
} from '../read-models/frozen-report-document.read-model';

const DEFAULT_TEMPLATE_NAME = 'report-final';
const TEMPLATE_ASSETS_BASE = '/template-assets';

const DRAFT_STEP_KEYS = [
  'meta',
  'description',
  'collection',
  'exploitation',
  'proofOfConcept',
  'risks',
  'remediation',
  'final',
] as const;

const LONG_FORM_SECTIONS: ReadonlyArray<{ key: string; titleKey: string }> = [
  { key: 'collection', titleKey: 'collection' },
  { key: 'exploitation', titleKey: 'exploitation' },
  { key: 'proofOfConcept', titleKey: 'proofOfConcept' },
  { key: 'risks', titleKey: 'risks' },
  { key: 'remediation', titleKey: 'remediation' },
];

const DEFAULT_LABELS_FR: Record<string, string> = {
  reportTitle: 'Rapport de sécurité',
  metaSectionTitle: 'Métadonnées',
  cvssSectionTitle: 'Évaluation CVSS',
  teamSectionTitle: 'Équipe rapport',
  collection: 'Collecte d’informations',
  exploitation: 'Exploitation',
  proofOfConcept: 'Preuve de concept (PoC)',
  risks: 'Risques',
  remediation: 'Remédiation',
  fieldReportTitle: 'Titre du rapport',
  fieldScope: 'Scope',
  fieldBugType: 'Type de vulnérabilité',
  fieldEndpoint: 'Endpoint',
  fieldCve: 'CVE',
  fieldImpact: 'Impact',
  fieldMember: 'Membre',
  fieldRole: 'Rôle',
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function parseJsonIfString(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }
  const trimmed = value.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return value;
  }
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return value;
  }
}

/** Accepts canonical `{ steps: { meta: StepStateWire, … } }` and legacy flat snapshots. */
function resolveSteps(root: Record<string, unknown>): Record<string, unknown> | null {
  const rawSteps = parseJsonIfString(root['steps']);
  const nested = asRecord(rawSteps);
  if (nested) {
    return nested;
  }

  const fromRoot: Record<string, unknown> = {};
  let found = false;
  for (const key of DRAFT_STEP_KEYS) {
    if (root[key] !== undefined) {
      fromRoot[key] = root[key];
      found = true;
    }
  }
  return found ? fromRoot : null;
}

function stepPayload(
  steps: Record<string, unknown>,
  stepKey: string,
): Record<string, unknown> {
  const step = asRecord(steps[stepKey]);
  if (!step) {
    return {};
  }
  const payload = asRecord(step['payload']);
  if (payload) {
    return payload;
  }
  // Raw step payload (e.g. `report_draft_steps.payload` only).
  return step;
}

function sectionBlocsFromPayload(
  payload: Record<string, unknown>,
): Array<Record<string, unknown>> {
  const raw = payload['sectionBlocs'];
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter(
    (item): item is Record<string, unknown> =>
      typeof item === 'object' && item !== null && !Array.isArray(item),
  );
}

function buildSections(
  steps: Record<string, unknown>,
  labels: Record<string, string>,
): FrozenReportSectionReadModel[] {
  const out: FrozenReportSectionReadModel[] = [];
  for (const { key, titleKey } of LONG_FORM_SECTIONS) {
    const payload = stepPayload(steps, key);
    const blocs = sectionBlocsFromPayload(payload);
    if (blocs.length === 0 && Object.keys(payload).length === 0) {
      continue;
    }
    out.push({
      key,
      title: labels[titleKey] ?? key,
      sectionBlocs: blocs,
    });
  }
  return out;
}

function resolveTitle(meta: Record<string, unknown>, teamLabel: string | null): string {
  const fromMeta = String(meta['reportTitle'] ?? '').trim();
  if (fromMeta) {
    return fromMeta;
  }
  if (teamLabel?.trim()) {
    return teamLabel.trim();
  }
  return DEFAULT_LABELS_FR.reportTitle ?? 'Rapport de sécurité';
}

export type MapFrozenContentInput = {
  reportId: string;
  reportStatus: string;
  hunterId: string;
  frozenContent: unknown;
  locale?: string;
};

export function mapFrozenContentToDocument(
  input: MapFrozenContentInput,
): FrozenReportDocumentReadModel {
  const root = asRecord(parseJsonIfString(input.frozenContent));
  if (!root) {
    throw new ReportDataInvalidError(
      `Report '${input.reportId}' has no frozen_content snapshot.`,
    );
  }

  const schemaVersion = Number(root['schemaVersion'] ?? 0);
  if (schemaVersion !== 1) {
    throw new ReportDataInvalidError(
      `Unsupported frozen_content schemaVersion '${String(root['schemaVersion'])}' on report '${input.reportId}'.`,
    );
  }

  const steps = resolveSteps(root);
  if (!steps) {
    throw new ReportDataInvalidError(
      `Missing 'steps' in frozen_content for report '${input.reportId}'.`,
    );
  }

  const locale =
    typeof input.locale === 'string' && /^[a-z]{2}$/i.test(input.locale.trim())
      ? input.locale.trim().toLowerCase()
      : 'fr';

  const labels = { ...DEFAULT_LABELS_FR };
  const meta = stepPayload(steps, 'meta');
  const cvss = stepPayload(steps, 'description');

  const teamRaw = asRecord(root['reportTeam']);
  const reportTeam =
    teamRaw && Array.isArray(teamRaw['members'])
      ? {
          label: String(teamRaw['label'] ?? '').trim(),
          members: (teamRaw['members'] as unknown[])
            .map((m) => asRecord(m))
            .filter((m): m is Record<string, unknown> => m !== null)
            .map((m) => ({
              userId: String(m['userId'] ?? ''),
              displayName: String(m['displayName'] ?? m['userId'] ?? ''),
              role: String(m['role'] ?? ''),
            })),
        }
      : null;

  const title = resolveTitle(meta, reportTeam?.label ?? null);

  return {
    htmlLang: locale,
    language: locale,
    templateName: DEFAULT_TEMPLATE_NAME,
    templateStylesheetUrl: `${TEMPLATE_ASSETS_BASE}/${DEFAULT_TEMPLATE_NAME}/styles/styles.css`,
    reportId: input.reportId,
    reportStatus: input.reportStatus,
    sourceDraftId: String(root['sourceDraftId'] ?? ''),
    draftVersion: Number(root['draftVersion'] ?? 0),
    hunterId: String(root['hunterId'] ?? input.hunterId),
    frozenAt: String(root['frozenAt'] ?? ''),
    title,
    meta,
    cvss,
    sections: buildSections(steps, labels),
    reportTeam,
    labels,
  };
}
