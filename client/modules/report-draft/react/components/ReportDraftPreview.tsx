"use client";

import { type FC, useMemo } from "react";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import {
  cumulativeStepsForHunter,
  payloadResolverFromDraft,
} from "@modules/report-draft/core/view/report-draft-preview-steps";
import { ReportDraftDocumentPreview } from "@modules/report-draft/react/components/ReportDraftDocumentPreview";
import { useAppSelector } from "@store/redux/store";

/**
 * Hunter workspace — aperçu de l'étape courante (données du brouillon en base / Redux).
 */
export const ReportDraftPreview: FC = () => {
  const step = useAppSelector((s) => s.reportDraft.step);
  const draftId = useAppSelector((s) => s.reportDrafts.currentDraftId);
  const draft = useAppSelector((s) =>
    draftId ? s.reportDrafts.byId[draftId] : undefined,
  );

  const resolvePayload = useMemo(
    () => (draft ? payloadResolverFromDraft(draft) : () => ({})),
    [draft],
  );

  if (!draft) {
    return (
      <p className="text-sm text-form-text-muted">
        Chargez un brouillon pour afficher l&apos;aperçu.
      </p>
    );
  }

  return (
    <ReportDraftDocumentPreview
      draft={draft}
      steps={[step]}
      resolvePayload={resolvePayload}
    />
  );
};

/**
 * Hunter workspace — aperçu cumulatif META → étape courante.
 */
export const ReportDraftCumulativePreview: FC = () => {
  const step = useAppSelector((s) => s.reportDraft.step);
  const draftId = useAppSelector((s) => s.reportDrafts.currentDraftId);
  const draft = useAppSelector((s) =>
    draftId ? s.reportDrafts.byId[draftId] : undefined,
  );

  const steps = useMemo(() => cumulativeStepsForHunter(step), [step]);
  const resolvePayload = useMemo(
    () => (draft ? payloadResolverFromDraft(draft) : () => ({})),
    [draft],
  );

  if (!draft) {
    return (
      <p className="text-sm text-form-text-muted">
        Chargez un brouillon pour afficher l&apos;aperçu.
      </p>
    );
  }

  return (
    <ReportDraftDocumentPreview
      draft={draft}
      steps={steps}
      resolvePayload={resolvePayload}
      showCover
    />
  );
};
