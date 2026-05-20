import type {
  ReportDraftStepStateKeyWire,
  ReportDraftWire,
} from '../models/report-draft-api.types';

/** Wizard steps hunters edit (FINAL is legacy DB slot — not shown in UI). */
export const HUNTER_WIZARD_STEP_STATE_KEYS: ReadonlyArray<ReportDraftStepStateKeyWire> = [
  'meta',
  'description',
  'collection',
  'exploitation',
  'proofOfConcept',
  'risks',
  'remediation',
];

export function hunterWizardStepsApproved(
  draft: Record<ReportDraftStepStateKeyWire, { status: string }>,
): boolean {
  return HUNTER_WIZARD_STEP_STATE_KEYS.every((key) => draft[key].status === 'approved');
}

/** Legacy FINAL wizard step removed — auto-approve when hunter steps are done. */
export function syncSkippedFinalWizardStep(draft: ReportDraftWire): ReportDraftWire {
  if (!hunterWizardStepsApproved(draft)) {
    return draft;
  }
  if (draft.final.status === 'approved' && draft.aggregateStatus === 'ready-to-program') {
    return draft;
  }
  return {
    ...draft,
    final: { ...draft.final, status: 'approved' },
    aggregateStatus:
      draft.aggregateStatus === 'draft' || draft.aggregateStatus === 'under-review'
        ? 'ready-to-program'
        : draft.aggregateStatus,
  };
}
