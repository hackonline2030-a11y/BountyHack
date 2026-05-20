import { DraftStep } from '../../../generated/prisma/enums';
import type { ReportDraftStepStateKeyWire } from '../../models/report-draft-api.types';

const STATE_KEY_TO_DRAFT_STEP: Record<ReportDraftStepStateKeyWire, DraftStep> = {
  meta: DraftStep.META,
  description: DraftStep.DESCRIPTION,
  collection: DraftStep.COLLECTION,
  exploitation: DraftStep.EXPLOITATION,
  proofOfConcept: DraftStep.PROOF_OF_CONCEPT,
  risks: DraftStep.RISKS,
  remediation: DraftStep.REMEDIATION,
  final: DraftStep.FINAL,
};

const VALID_STATE_KEYS = new Set<string>(Object.keys(STATE_KEY_TO_DRAFT_STEP));

export function parseReportDraftStepStateKey(value: string): ReportDraftStepStateKeyWire | null {
  if (!VALID_STATE_KEYS.has(value)) {
    return null;
  }
  return value as ReportDraftStepStateKeyWire;
}

export function draftStepForStateKey(stepKey: ReportDraftStepStateKeyWire): DraftStep {
  return STATE_KEY_TO_DRAFT_STEP[stepKey];
}
