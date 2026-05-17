"use client";

import Link from "next/link";
import { useEffect } from "react";
import { loadGlobalSubmissionForReview } from "@modules/report-draft/core/useCase/load-global-submission-for-review.usecase";
import { GlobalSubmissionReviewBoard } from "@modules/report-draft/react/pages/GlobalSubmissionReviewBoard";
import { useAppDispatch, useAppSelector } from "@store/redux/store";

type Props = {
  globalSubmissionId: string;
  lng: string;
  backHref: string;
  isSuperAdmin: boolean;
  finalValidationHref?: string;
};

export const GlobalSubmissionReviewBootstrap: React.FC<Props> = ({
  globalSubmissionId,
  lng,
  backHref,
  isSuperAdmin,
  finalValidationHref,
}) => {
  const dispatch = useAppDispatch();
  const reviewLoad = useAppSelector((s) => s.reportDrafts.reviewLoad);
  const globalSubmission = useAppSelector(
    (s) => s.reportDrafts.globalSubmissionsById[globalSubmissionId],
  );
  const resolvedFinalValidationHref =
    isSuperAdmin && globalSubmission
      ? `/${lng}/administration/final-validation/${encodeURIComponent(globalSubmission.reportDraftId)}`
      : finalValidationHref;

  useEffect(() => {
    void dispatch(loadGlobalSubmissionForReview({ globalSubmissionId }));
  }, [dispatch, globalSubmissionId]);

  if (reviewLoad.status === "loading" || reviewLoad.status === "idle") {
    return (
      <div
        role="status"
        aria-busy="true"
        className="mx-auto my-10 max-w-4xl rounded-lg border border-form-border bg-form-surface p-8 text-sm text-form-text-muted"
      >
        Chargement de la révision globale…
      </div>
    );
  }

  if (reviewLoad.status === "error") {
    return (
      <div
        role="alert"
        className="mx-auto my-10 max-w-2xl rounded-lg border border-rose-200 bg-rose-50 p-6 text-rose-900"
      >
        <p className="font-semibold">Impossible de charger la soumission globale</p>
        <p className="mt-2 text-sm">{reviewLoad.message}</p>
        <Link href={backHref} className="mt-4 inline-block text-sm font-medium underline">
          ← Retour
        </Link>
      </div>
    );
  }

  return (
    <GlobalSubmissionReviewBoard
      globalSubmissionId={globalSubmissionId}
      lng={lng}
      backHref={backHref}
      isSuperAdmin={isSuperAdmin}
      finalValidationHref={resolvedFinalValidationHref}
    />
  );
};
