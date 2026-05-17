"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useT } from "next-i18next/client";
import { STEP_TITLE_FR } from "@modules/report-draft/core/model/step-field-catalog";
import { hasOpenSuperAdminRevisionCycle } from "@modules/report-draft/core/model/super-admin-final-validation";
import { GlobalRevisionRequestsTable } from "@modules/report-draft/react/components/GlobalRevisionRequestsTable";
import {
  submissionRowIsActionable,
  submissionRowStatusLabel,
} from "@modules/report-draft/core/model/submission-review-status";
import { reportDraftsSlice } from "@modules/report-draft/core/store/report-drafts.slice";
import { listMentorPeerSubmissionsForQc } from "@modules/report-draft/core/useCase/list-mentor-peer-submissions-for-qc.usecase";
import { listReviewerSubmissions } from "@modules/report-draft/core/useCase/list-reviewer-submissions.usecase";
import { listReviewerGlobalSubmissions } from "@modules/report-draft/core/useCase/list-reviewer-global-submissions.usecase";
import {
  globalSubmissionRowIsActionable,
  globalSubmissionRowStatusLabel,
} from "@modules/report-draft/core/model/global-submission-review-status";
import { loadReportDraft } from "@modules/report-draft/core/useCase/load-report-draft.usecase";
import {
  isUnauthorizedHttpError,
  sessionExpiredUserMessage,
} from "@/lib/session-refresh";
import { ActionButton } from "@modules/app/nextjs/components/buttons/ActionButton";
import { ScrollableTablePanel } from "@modules/report-draft/react/components/ScrollableTablePanel";
import { SubmissionReviewDraftTitleCell } from "@modules/report-draft/react/components/SubmissionReviewDraftTitleCell";
import { useAppDispatch, useAppSelector } from "@store/redux/store";

type Props = {
  lng: string;
};

const decisionLabelFr = (decision: string): string => {
  switch (decision) {
    case "pending":
      return "pending";
    case "approve":
      return "approuvé";
    case "request-changes":
      return "révisions";
    case "endorse":
      return "avis mentor OK";
    default:
      return decision;
  }
};

export const QualityCheckerSubmissionsPage: React.FC<Props> = ({ lng }) => {
  const { t } = useT("myReports");
  const searchParams = useSearchParams();
  const filterDraftId = searchParams.get("draftId")?.trim() || null;

  const dispatch = useAppDispatch();
  const reviewList = useAppSelector((s) => s.reportDrafts.reviewList);
  const submissionIds = useAppSelector((s) => s.reportDrafts.pendingSubmissionIds);
  const submissionsById = useAppSelector((s) => s.reportDrafts.submissionsById);
  const globalSubmissionIds = useAppSelector(
    (s) => s.reportDrafts.pendingGlobalSubmissionIds,
  );
  const globalSubmissionsById = useAppSelector((s) => s.reportDrafts.globalSubmissionsById);
  const draftsById = useAppSelector((s) => s.reportDrafts.byId);

  const mentorPeerIds = useAppSelector((s) => s.reportDrafts.mentorPeerSubmissionIds);

  useEffect(() => {
    void dispatch(listReviewerSubmissions({ reviewerRole: "quality_checker" }));
    void dispatch(listReviewerGlobalSubmissions({ reviewerRole: "quality_checker" }));
    void dispatch(listMentorPeerSubmissionsForQc());
  }, [dispatch]);

  useEffect(() => {
    if (!filterDraftId) return;
    dispatch(reportDraftsSlice.actions.setCurrentDraftId(filterDraftId));
    void dispatch(loadReportDraft({ draftId: filterDraftId }));
  }, [dispatch, filterDraftId]);

  const filterByDraft = <T extends { reportDraftId: string }>(items: T[]): T[] =>
    filterDraftId ? items.filter((s) => s.reportDraftId === filterDraftId) : items;

  const rows = useMemo(
    () =>
      filterByDraft(
        submissionIds
          .map((id) => submissionsById[id])
          .filter((s) => s != null && s.reviewerRole === "quality_checker"),
      ),
    [submissionIds, submissionsById, filterDraftId],
  );

  const globalRows = useMemo(
    () =>
      filterByDraft(
        globalSubmissionIds
          .map((id) => globalSubmissionsById[id])
          .filter((g) => g != null && g.reviewerRole === "quality_checker"),
      ),
    [globalSubmissionIds, globalSubmissionsById, filterDraftId],
  );

  const mentorRows = useMemo(
    () =>
      filterByDraft(
        mentorPeerIds
          .map((id) => submissionsById[id])
          .filter((s) => s != null && s.reviewerRole === "mentor"),
      ),
    [mentorPeerIds, submissionsById, filterDraftId],
  );

  const focusedDraft = filterDraftId ? draftsById[filterDraftId] : undefined;
  const showGlobalRevisionLink =
    filterDraftId && focusedDraft && hasOpenSuperAdminRevisionCycle(focusedDraft);

  return (
    <div className="mx-auto w-full max-w-6xl px-2 py-6 sm:px-4">
      <div className="dashboard-card flex flex-col gap-6 p-5 sm:p-6">
        <header className="mb-2">
          <Link
            href={
              filterDraftId
                ? `/${lng}/team-reports`
                : `/${lng}/welcome-quality-checker`
            }
            className="text-sm text-dashboard-accent hover:underline"
          >
            ← {filterDraftId ? t("myReports.teamReports.back") : "Accueil QC"}
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-dashboard-text">
            {filterDraftId
              ? t("myReports.qcSubmissions.filteredHeading")
              : "Historique des revues"}
          </h1>
          <p className="text-sm text-dashboard-text-muted">
            {filterDraftId
              ? t("myReports.qcSubmissions.filteredSubheading")
              : "Soumissions hunter vers le QC. Les révisions globales super-admin sont listées ci-dessous."}
          </p>
        </header>

        {showGlobalRevisionLink ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            {t("myReports.qcSubmissions.globalRevisionOnReportHint")}{" "}
            <Link
              href={`/${lng}/global-revisions/${encodeURIComponent(filterDraftId!)}`}
              className="font-semibold text-amber-900 underline hover:text-amber-950"
            >
              {t("myReports.qcSubmissions.openGlobalRevisionDraft")}
            </Link>
          </p>
        ) : null}

        {!filterDraftId ? (
          <GlobalRevisionRequestsTable
            draftsById={draftsById}
            lng={lng}
            reviewBasePath={`/${lng}/global-revisions`}
          />
        ) : null}

        {reviewList.status === "loading" ? (
          <p className="text-sm text-dashboard-text-muted">Chargement…</p>
        ) : null}
        {reviewList.status === "error" ? (
          <p
            role="alert"
            className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900"
          >
            {isUnauthorizedHttpError(reviewList.message)
              ? sessionExpiredUserMessage()
              : reviewList.message}
          </p>
        ) : null}

        {reviewList.status === "success" && rows.length === 0 ? (
          <p className="rounded-md border border-dashboard-card-border bg-white p-4 text-sm text-dashboard-text-muted">
            {filterDraftId
              ? t("myReports.qcSubmissions.emptyFiltered")
              : "Aucune soumission QC. Le hunter doit « Soumettre pour revue » avec Quality checker."}
          </p>
        ) : null}

        {globalRows.length > 0 ? (
          <section>
            <h2 className="text-lg font-semibold text-dashboard-text">
              {t("myReports.qcSubmissions.globalSubmissionsTitle")}
            </h2>
            <ScrollableTablePanel className="mt-3">
              <table className="w-full min-w-[960px] text-left text-sm">
                <thead className="sticky top-0 z-10 border-b border-form-border bg-form-overlay text-form-text-muted">
                  <tr>
                    <th className="px-3 py-3 font-medium">Rapport</th>
                    <th className="px-3 py-3 font-medium">Type</th>
                    <th className="px-3 py-3 font-medium">Révision n°</th>
                    <th className="px-3 py-3 font-medium">Statut</th>
                    <th className="px-3 py-3 font-medium">Soumis le</th>
                    <th className="px-3 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {globalRows.map((globalSubmission) => {
                    const draft = draftsById[globalSubmission.reportDraftId];
                    const statusLabel = globalSubmissionRowStatusLabel(
                      globalSubmission,
                      draft,
                    );
                    const actionable = globalSubmissionRowIsActionable(
                      globalSubmission,
                      draft,
                    );

                    return (
                      <tr
                        key={globalSubmission.id}
                        className="border-b border-form-border last:border-0 bg-violet-50/40"
                      >
                        <td className="px-3 py-3 align-top">
                          <SubmissionReviewDraftTitleCell draft={draft} />
                        </td>
                        <td className="px-3 py-3 text-form-text">
                          {t("myReports.qcSubmissions.globalSubmissionStepLabel")}
                        </td>
                        <td className="px-3 py-3 text-form-text">
                          {globalSubmission.revisionNumber}
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={
                              actionable
                                ? "font-medium text-amber-800"
                                : "text-form-text-muted"
                            }
                          >
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-form-text-muted">
                          {new Date(globalSubmission.submittedAt).toLocaleString("fr-FR")}
                        </td>
                        <td className="px-3 py-3">
                          <Link
                            href={`/${lng}/global-submissions/${encodeURIComponent(globalSubmission.id)}`}
                            className="font-medium text-dashboard-accent hover:underline"
                          >
                            {t("myReports.qcSubmissions.openGlobalSubmissionReview")}
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </ScrollableTablePanel>
          </section>
        ) : null}

        {rows.length > 0 ? (
          <section>
            <h2 className="text-lg font-semibold text-dashboard-text">
              {t("myReports.qcSubmissions.hunterSubmissionsTitle")}
            </h2>
            <ScrollableTablePanel className="mt-3">
              <table className="w-full min-w-[960px] text-left text-sm">
                <thead className="sticky top-0 z-10 border-b border-form-border bg-form-overlay text-form-text-muted">
                  <tr>
                    <th className="px-3 py-3 font-medium">Rapport</th>
                    <th className="px-3 py-3 font-medium">Étape</th>
                    <th className="px-3 py-3 font-medium">Round</th>
                    <th className="px-3 py-3 font-medium">Statut</th>
                    <th className="px-3 py-3 font-medium">Soumis le</th>
                    <th className="px-3 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((submission) => {
                    const draft = draftsById[submission.reportDraftId];
                    const statusLabel = submissionRowStatusLabel(submission, draft);
                    const actionable = submissionRowIsActionable(submission, draft);

                    return (
                      <tr
                        key={submission.id}
                        className="border-b border-form-border last:border-0"
                      >
                        <td className="px-3 py-3 align-top">
                          <SubmissionReviewDraftTitleCell draft={draft} />
                        </td>
                        <td className="px-3 py-3 text-form-text">
                          {STEP_TITLE_FR[submission.step]}
                        </td>
                        <td className="px-3 py-3 text-form-text">{submission.round}</td>
                        <td className="px-3 py-3">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                              actionable
                                ? "bg-amber-100 text-amber-950"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {statusLabel}
                          </span>
                          <span className="mt-0.5 block text-xs text-form-text-muted">
                            ({decisionLabelFr(submission.decision)})
                          </span>
                        </td>
                        <td className="px-3 py-3 text-form-text-muted">
                          {new Date(submission.submittedAt).toLocaleString("fr-FR")}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <Link
                            href={`/${lng}/submissions/${submission.id}`}
                            className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                              actionable
                                ? "bg-form-accent text-white hover:bg-form-accent-hover"
                                : "border border-form-border text-form-text hover:bg-form-overlay"
                            }`}
                          >
                            {actionable ? "Revoir" : "Consulter"}
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </ScrollableTablePanel>
          </section>
        ) : null}

        {mentorRows.length > 0 ? (
          <section className="mt-6">
            <h2 className="text-lg font-semibold text-dashboard-text">
              Conseil mentor (lecture seule)
            </h2>
            <ScrollableTablePanel className="mt-3 border-violet-200">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="sticky top-0 z-10 border-b border-violet-100 bg-violet-50 text-form-text-muted">
                  <tr>
                    <th className="px-3 py-3 font-medium">Rapport</th>
                    <th className="px-3 py-3 font-medium">Étape</th>
                    <th className="px-3 py-3 font-medium">Statut</th>
                    <th className="px-3 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {mentorRows.map((submission) => {
                    const draft = draftsById[submission.reportDraftId];
                    const statusLabel = submissionRowStatusLabel(submission, draft);
                    return (
                      <tr
                        key={submission.id}
                        className="border-b border-violet-100 last:border-0"
                      >
                        <td className="px-3 py-3 align-top">
                          <SubmissionReviewDraftTitleCell draft={draft} />
                        </td>
                        <td className="px-3 py-3">{STEP_TITLE_FR[submission.step]}</td>
                        <td className="px-3 py-3 text-form-text-muted">{statusLabel}</td>
                        <td className="px-3 py-3 text-right">
                          <Link
                            href={`/${lng}/submissions/${submission.id}`}
                            className="rounded-md border border-violet-300 px-3 py-1.5 text-xs font-medium text-violet-950 hover:bg-violet-50"
                          >
                            Consulter
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </ScrollableTablePanel>
          </section>
        ) : null}

        <ActionButton
          variant="secondary"
          className="mt-4 self-start"
          onClick={() => {
            void dispatch(listReviewerSubmissions({ reviewerRole: "quality_checker" }));
            void dispatch(listReviewerGlobalSubmissions({ reviewerRole: "quality_checker" }));
            void dispatch(listMentorPeerSubmissionsForQc());
            if (filterDraftId) {
              void dispatch(loadReportDraft({ draftId: filterDraftId }));
            }
          }}
        >
          Rafraîchir la liste
        </ActionButton>
      </div>
    </div>
  );
};
