"use client";

import Link from "next/link";
import { useEffect } from "react";
import { loadReportDraft } from "@modules/report-draft/core/useCase/load-report-draft.usecase";
import { ReportDraftFinalValidationWorkspacePage } from "@modules/report-draft/react/pages/ReportDraftFinalValidationWorkspacePage";
import { useAppDispatch, useAppSelector } from "@store/redux/store";

type Props = {
  draftId: string;
  teamsHref: string;
};

export const ReportDraftFinalValidationBootstrap: React.FC<Props> = ({
  draftId,
  teamsHref,
}) => {
  const dispatch = useAppDispatch();
  const load = useAppSelector((s) => s.reportDrafts.load);
  const draft = useAppSelector((s) => s.reportDrafts.byId[draftId]);

  useEffect(() => {
    void dispatch(loadReportDraft({ draftId }));
  }, [dispatch, draftId]);

  if (load.status === "loading" || load.status === "idle") {
    return <LoadingState />;
  }

  if (load.status === "error" || draft === undefined) {
    const message =
      load.status === "error"
        ? load.message
        : `Draft '${draftId}' not loaded in the slice.`;
    return <ErrorState message={message} backHref={teamsHref} />;
  }

  return <ReportDraftFinalValidationWorkspacePage draft={draft} teamsHref={teamsHref} />;
};

const LoadingState: React.FC = () => (
  <div
    role="status"
    aria-busy="true"
    className="mx-auto my-6 flex w-full max-w-4xl flex-col gap-6 rounded-lg border border-black/10 bg-form-surface px-4 py-6 shadow-xl sm:my-10 sm:px-6 sm:py-8"
  >
    <div className="h-6 w-48 animate-pulse rounded bg-black/5" />
    <div className="h-40 animate-pulse rounded bg-black/5" />
    <div className="h-10 w-32 animate-pulse rounded bg-black/5" />
  </div>
);

const ErrorState: React.FC<{ message: string; backHref: string }> = ({
  message,
  backHref,
}) => (
  <div
    role="alert"
    className="mx-auto my-6 flex w-full max-w-2xl flex-col gap-4 rounded-lg border border-rose-200 bg-rose-50 p-6 text-rose-900 shadow-sm sm:my-10 sm:p-8"
  >
    <h1 className="text-lg font-semibold sm:text-xl">Rapport introuvable</h1>
    <p className="text-sm">{message}</p>
    <Link
      href={backHref}
      className="self-start rounded-md bg-rose-900 px-4 py-2 text-sm font-semibold text-rose-50 transition hover:bg-rose-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-rose-700"
    >
      ← Retour
    </Link>
  </div>
);
