import { readFileSync } from 'fs';
import { ReportDataInvalidError } from '../errors/pdf-application.errors';
import { REPORT_DRAFT_STEP_STATE_KEYS } from '../../../report-draft/models/report-draft-api.types';
import { resolveReportImageAssetPath } from '../../../report-draft/application/attachments/report-draft-image-storage';
import type {
  FrozenReportDocumentReadModel,
  FrozenReportSectionReadModel,
  FrozenReportTocEntryReadModel,
} from '../read-models/frozen-report-document.read-model';

const DEFAULT_TEMPLATE_NAME = 'report-final';
const TEMPLATE_ASSETS_BASE = '/template-assets';

const CVSS_METRIC_KEYS = new Set([
  'scope',
  'integrity',
  'attackVector',
  'availability',
  'confidentiality',
  'userInteraction',
  'attackComplexity',
  'privilegesRequired',
]);

/** PDF chapter title keys (meta / team / CVSS stay on the dashboard only). */
const PDF_CHAPTER_TITLE_KEY: Record<string, string> = {
  description: 'descriptionSectionTitle',
  collection: 'collection',
  exploitation: 'exploitation',
  proofOfConcept: 'proofOfConcept',
  risks: 'risks',
  remediation: 'remediation',
  final: 'final',
};

const DEFAULT_LABELS_FR: Record<string, string> = {
  reportTitle: 'Rapport de sécurité',
  tableOfContentsTitle: 'Table des matières',
  metaSectionTitle: 'Métadonnées',
  cvssSectionTitle: 'Évaluation CVSS',
  teamSectionTitle: 'Équipe rapport',
  descriptionSectionTitle: 'Description du challenge',
  collection: 'Collectes d’informations',
  exploitation: 'Exploitation',
  proofOfConcept: 'PoC',
  risks: 'Risque',
  remediation: 'Remédiation',
  final: 'Finalisation',
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
  for (const key of REPORT_DRAFT_STEP_STATE_KEYS) {
    if (root[key] !== undefined) {
      fromRoot[key] = root[key];
      found = true;
    }
  }
  return found ? fromRoot : null;
}

/** Resolves step payload from frozen `steps.*` (StepStateWire or raw payload). */
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
  if ('sectionBlocs' in step || !('status' in step)) {
    return step;
  }
  return {};
}

function extractCvssPayload(
  descriptionPayload: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of CVSS_METRIC_KEYS) {
    if (
      descriptionPayload[key] !== undefined &&
      descriptionPayload[key] !== null &&
      String(descriptionPayload[key]).trim() !== ''
    ) {
      out[key] = descriptionPayload[key];
    }
  }
  return out;
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

function stepAttachments(
  steps: Record<string, unknown>,
  stepKey: string,
): Array<Record<string, unknown>> {
  const step = asRecord(steps[stepKey]);
  const raw = step?.['attachments'];
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter(
    (item): item is Record<string, unknown> =>
      typeof item === 'object' && item !== null && !Array.isArray(item),
  );
}

function sectionBlocsWithImages(
  blocs: Array<Record<string, unknown>>,
  attachments: Array<Record<string, unknown>>,
): Array<Record<string, unknown>> {
  return blocs.map((bloc) => {
    const attachmentId = String(bloc['attachmentId'] ?? '').trim();
    if (!attachmentId) {
      return bloc;
    }
    const attachment = attachments.find((a) => String(a['id'] ?? '') === attachmentId);
    const image = attachment ? attachmentImageReadModel(attachment) : null;
    return image ? { ...bloc, image } : bloc;
  });
}

function attachmentImageReadModel(attachment: Record<string, unknown>) {
  const mimeType = String(attachment['mimeType'] ?? '').trim();
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(mimeType)) {
    return null;
  }
  const storageKey = String(attachment['storageKey'] ?? '').trim();
  if (!storageKey) {
    return null;
  }

  try {
    const file = readFileSync(resolveReportImageAssetPath(storageKey));
    return {
      src: `data:${mimeType};base64,${file.toString('base64')}`,
      filename: String(attachment['filename'] ?? 'report-image'),
      mimeType,
    };
  } catch {
    return null;
  }
}

function isCvssOnlyPayload(payload: Record<string, unknown>): boolean {
  const keys = Object.keys(payload).filter(
    (k) => payload[k] !== undefined && payload[k] !== null && String(payload[k]).trim() !== '',
  );
  if (keys.length === 0) {
    return false;
  }
  return keys.every((k) => CVSS_METRIC_KEYS.has(k));
}

function buildPdfSections(
  steps: Record<string, unknown>,
  labels: Record<string, string>,
): FrozenReportSectionReadModel[] {
  const out: FrozenReportSectionReadModel[] = [];
  for (const key of REPORT_DRAFT_STEP_STATE_KEYS) {
    if (key === 'meta') {
      continue;
    }
    const titleKey = PDF_CHAPTER_TITLE_KEY[key];
    if (!titleKey) {
      continue;
    }
    const payload = stepPayload(steps, key);
    const blocs = sectionBlocsFromPayload(payload);
    if (key === 'description' && blocs.length === 0 && isCvssOnlyPayload(payload)) {
      continue;
    }
    if (blocs.length === 0) {
      continue;
    }
    out.push({
      key,
      title: labels[titleKey] ?? key,
      sectionBlocs: sectionBlocsWithImages(blocs, stepAttachments(steps, key)),
    });
  }
  return out;
}

function resolveTitle(meta: Record<string, unknown>): string {
  const fromMeta = String(meta['reportTitle'] ?? '').trim();
  if (fromMeta) {
    return fromMeta;
  }
  return DEFAULT_LABELS_FR.reportTitle ?? 'Rapport de sécurité';
}

function resolveAuthorName(
  hunterId: string,
  reportTeam: FrozenReportDocumentReadModel['reportTeam'],
): string {
  if (!reportTeam?.members.length) {
    return hunterId;
  }
  const owner = reportTeam.members.find((m) => m.userId === hunterId);
  if (owner?.displayName.trim()) {
    return owner.displayName.trim();
  }
  const hunterMember = reportTeam.members.find((m) =>
    m.role.toLowerCase().includes('hunter'),
  );
  if (hunterMember?.displayName.trim()) {
    return hunterMember.displayName.trim();
  }
  return hunterId;
}

/** Cover TOC: first PDF chapter starts on page 2; the cover title is not listed. */
function buildPdfTableOfContents(
  chapterLabels: readonly string[],
): FrozenReportTocEntryReadModel[] {
  const entries: FrozenReportTocEntryReadModel[] = [];
  let page = 2;
  for (const label of chapterLabels) {
    const withColon = label.endsWith(':') ? label : `${label} :`;
    entries.push({ label: withColon, page });
    page += 1;
  }
  return entries;
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
  const cvss = extractCvssPayload(stepPayload(steps, 'description'));

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

  const title = resolveTitle(meta);
  const sections = buildPdfSections(steps, labels);
  const hunterId = String(root['hunterId'] ?? input.hunterId);
  const authorName = resolveAuthorName(hunterId, reportTeam);
  const tableOfContents = buildPdfTableOfContents(
    sections.map((s) => s.title),
  );

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
    authorName,
    tableOfContents,
    meta,
    cvss,
    sections,
    reportTeam,
    labels,
  };
}
