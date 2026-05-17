"use client";

import { type FC, useMemo } from "react";
import type { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import {
  cumulativeStepsForGeneralReportPreview,
  payloadResolverFromDraft,
} from "@modules/report-draft/core/view/report-draft-preview-steps";
import { ReportDraftDocumentPreview } from "@modules/report-draft/react/components/ReportDraftDocumentPreview";

type Props = {
  draft: ReportDraftDomainModel.ReportDraft;
};

/**
 * Aperçu général unifié (page de garde + chapitres) — super-admin, file d’attente, etc.
 * Données = brouillon en base uniquement (pas de snapshot soumission QC).
 */
export const ReportDraftGeneralPreview: FC<Props> = ({ draft }) => {
  const steps = useMemo(() => cumulativeStepsForGeneralReportPreview(draft), [draft]);
  const resolvePayload = useMemo(() => payloadResolverFromDraft(draft), [draft]);

  return (
    <ReportDraftDocumentPreview
      draft={draft}
      steps={steps}
      resolvePayload={resolvePayload}
      showCover
    />
  );
};
