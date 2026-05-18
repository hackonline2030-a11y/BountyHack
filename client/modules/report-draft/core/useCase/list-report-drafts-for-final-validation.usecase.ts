import type { IReportDraftFinalValidationGateway } from "@modules/report-draft/core/gateway/report-draft-final-validation.gateway";
import type {
  ListReportDraftsForFinalValidationResult,
  ReportDraftFinalValidationSummary,
} from "@modules/report-draft/core/model/report-draft-final-validation-summary.domain-model";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";

export type ListReportDraftsForFinalValidationDependencies = {
  gateway: IReportDraftFinalValidationGateway;
};

export type ListReportDraftsForFinalValidationInput = {
  token: string;
};

const AGGREGATE_STATUSES: readonly ReportDraftDomainModel.AggregateStatus[] = [
  "draft",
  "under-review",
  "ready-to-program",
  "submitted-to-program",
  "published",
  "given-up",
  "rejected",
] as const;

const STEP_STATUSES: readonly ReportDraftDomainModel.StepStatus[] = [
  "in-progress",
  "awaiting-review",
  "needs-revision",
  "approved",
  "in-global-progress",
  "needs-global-revision",
  "awaiting-global-review",
] as const;

const STEP_KEYS = [
  "meta",
  "description",
  "collection",
  "exploitation",
  "proofOfConcept",
  "risks",
  "remediation",
  "final",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(record: Record<string, unknown>, key: string): string | null {
  const raw = record[key];
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed || null;
}

function parseAggregateStatus(
  raw: unknown,
): ReportDraftDomainModel.AggregateStatus | null {
  if (typeof raw !== "string") return null;
  return (AGGREGATE_STATUSES as readonly string[]).includes(raw)
    ? (raw as ReportDraftDomainModel.AggregateStatus)
    : null;
}

function parseStepStatuses(
  raw: unknown,
): ReportDraftFinalValidationSummary["stepStatuses"] | null {
  if (!isRecord(raw)) return null;
  const result = {} as ReportDraftFinalValidationSummary["stepStatuses"];
  for (const key of STEP_KEYS) {
    const status = raw[key];
    if (
      typeof status !== "string" ||
      !(STEP_STATUSES as readonly string[]).includes(status)
    ) {
      return null;
    }
    result[key] = status as ReportDraftDomainModel.StepStatus;
  }
  return result;
}

function parseSummary(raw: unknown): ReportDraftFinalValidationSummary | null {
  if (!isRecord(raw)) return null;
  const id = readString(raw, "id");
  const hunterId = readString(raw, "hunterId");
  const aggregateStatus = parseAggregateStatus(raw["aggregateStatus"]);
  const stepStatuses = parseStepStatuses(raw["stepStatuses"]);
  const createdAt = readString(raw, "createdAt");
  const updatedAt = readString(raw, "updatedAt");
  if (!id || !hunterId || !aggregateStatus || !stepStatuses || !createdAt || !updatedAt) {
    return null;
  }
  const reportTitle =
    typeof raw["reportTitle"] === "string" ? raw["reportTitle"].trim() : "";
  const teamLabel =
    raw["teamLabel"] === null
      ? null
      : typeof raw["teamLabel"] === "string"
        ? raw["teamLabel"].trim() || null
        : null;
  return {
    id,
    hunterId,
    aggregateStatus,
    reportTitle,
    teamLabel,
    stepStatuses,
    createdAt,
    updatedAt,
  };
}

export async function listReportDraftsForFinalValidationUseCase(
  input: ListReportDraftsForFinalValidationInput,
  deps: ListReportDraftsForFinalValidationDependencies,
): Promise<ListReportDraftsForFinalValidationResult> {
  let res: Response;
  try {
    res = await deps.gateway.listFinalValidationQueue(input.token);
  } catch {
    return { ok: false, reason: "unreachable" };
  }

  if (res.status === 401) {
    return { ok: false, reason: "unauthorized" };
  }
  if (!res.ok) {
    return { ok: false, reason: "unreachable" };
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    return { ok: false, reason: "malformed_payload" };
  }

  if (!Array.isArray(data)) {
    return { ok: false, reason: "malformed_payload" };
  }

  const items: ReportDraftFinalValidationSummary[] = [];
  for (const row of data) {
    const parsed = parseSummary(row);
    if (parsed === null) {
      return { ok: false, reason: "malformed_payload" };
    }
    items.push(parsed);
  }

  return { ok: true, items };
}
