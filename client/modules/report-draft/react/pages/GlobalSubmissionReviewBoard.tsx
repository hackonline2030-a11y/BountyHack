"use client";

import Link from "next/link";
import { type FC, useCallback, useMemo, useState } from "react";
import { useT } from "next-i18next/client";
import { FormPanelButton } from "@modules/app/nextjs/components/buttons/FormPanelButton";
import { globalSubmissionRowStatusLabel } from "@modules/report-draft/core/model/global-submission-review-status";
import { canDecideOnGlobalSubmission } from "@modules/report-draft/core/model/super-admin-final-validation";
import { approveGlobalSubmission } from "@modules/report-draft/core/useCase/approve-global-submission.usecase";
import { requestGlobalSubmissionChanges } from "@modules/report-draft/core/useCase/request-global-submission-changes.usecase";
import { ReportDraftAggregateStatusBadge } from "@modules/report-draft/react/components/ReportDraftAggregateStatusBadge";
import { ReportDraftGeneralPreview } from "@modules/report-draft/react/components/ReportDraftGeneralPreview";
import { ReportDraftTeamContextBanner } from "@modules/report-draft/react/components/ReportDraftTeamContextBanner";
import { QualityCriteriaChecklistPanel } from "@modules/quality/react/QualityCriteriaChecklistPanel";
import { useAppDispatch, useAppSelector } from "@store/redux/store";

const roleLabelFr = (role: string): string => {
  switch (role) {
    case "quality_checker":
      return "Quality checker";
    case "super_admin":
      return "Super-admin";
    case "mentor":
      return "Mentor";
    default:
      return role;
  }
};

type Props = {
  globalSubmissionId: string;
  lng: string;
  backHref: string;
  isSuperAdmin: boolean;
  finalValidationHref?: string;
};

export const GlobalSubmissionReviewBoard: FC<Props> = ({
  globalSubmissionId,
  lng,
  backHref,
  isSuperAdmin,
  finalValidationHref,
}) => {
  const { t } = useT(["myReports", "reportDraft"]);
  const dispatch = useAppDispatch();
  const transition = useAppSelector((s) => s.reportDrafts.transition);
  const globalSubmission = useAppSelector(
    (s) => s.reportDrafts.globalSubmissionsById[globalSubmissionId],
  );
  const draft = useAppSelector((s) =>
    globalSubmission ? s.reportDrafts.byId[globalSubmission.reportDraftId] : undefined,
  );
  const globalComments = useAppSelector((s) =>
    Object.values(s.reportDrafts.globalReviewerCommentsById).filter(
      (c) => c.globalSubmissionId === globalSubmissionId,
    ),
  );

  const [revisionComment, setRevisionComment] = useState("");

  const busy = transition.status === "loading";
  const err = transition.status === "error" ? transition.message : null;
  const canDecide = canDecideOnGlobalSubmission(draft, globalSubmission);
  const readOnlyClosed = Boolean(globalSubmission && draft && !canDecide);
  const statusLabel = globalSubmission
    ? globalSubmissionRowStatusLabel(globalSubmission, draft)
    : "";

  const headline = useMemo(() => {
    const title = draft?.meta.payload?.reportTitle;
    return typeof title === "string" && title.trim() !== ""
      ? title.trim()
      : t("myReports.card.untitled");
  }, [draft, t]);

  void lng;

  const onApproveRevision = useCallback(() => {
    void dispatch(approveGlobalSubmission({ globalSubmissionId }));
  }, [dispatch, globalSubmissionId]);

  const onRequestChanges = useCallback(() => {
    const body = revisionComment.trim();
    if (!body) return;
    void dispatch(
      requestGlobalSubmissionChanges({
        globalSubmissionId,
        comments: [body],
      }),
    );
  }, [dispatch, globalSubmissionId, revisionComment]);

  if (!globalSubmission || !draft) {
    return (
      <p className="text-sm text-rose-700" role="alert">
        Soumission globale introuvable.
      </p>
    );
  }

  return (
    <div className="mx-auto my-6 flex w-full max-w-4xl flex-col gap-6 rounded-lg border border-black/10 bg-form-surface px-4 py-6 shadow-xl sm:my-10 sm:px-6 sm:py-8">
      <div className="-mb-2">
        <Link
          href={backHref}
          className="inline-flex text-sm font-medium text-form-accent hover:underline"
        >
          {t("myReports.globalRevisionReview.back")}
        </Link>
      </div>

      <header className="flex flex-col gap-2 border-b border-form-border pb-4">
        <p className="text-xs font-medium uppercase tracking-wide text-violet-800">
          {t("myReports.qcSubmissions.globalSubmissionsTitle")} —{" "}
          {roleLabelFr(globalSubmission.reviewerRole)}
        </p>
        <h1 className="text-xl font-semibold text-form-text sm:text-2xl">{headline}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <ReportDraftAggregateStatusBadge
            status={draft.aggregateStatus}
            label={t(`myReports.status.${draft.aggregateStatus}`)}
          />
          <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-950">
            {t("myReports.qcSubmissions.globalSubmissionStepLabel")} n°
            {globalSubmission.revisionNumber}
          </span>
          <span className="text-sm text-form-text-muted">{statusLabel}</span>
        </div>
        <p className="text-sm text-form-text-muted">
          {t("myReports.globalSubmissionReview.hint")}
        </p>
      </header>

      {draft.reportTeam ? (
        <ReportDraftTeamContextBanner team={draft.reportTeam} className="mt-0 mb-0" />
      ) : null}

      <section className="rounded-lg border border-form-border bg-form-surface p-4">
        <h2 className="mb-3 text-sm font-semibold text-form-text">
          {t("myReports.review.tabs.criteria")}
        </h2>
        <QualityCriteriaChecklistPanel
          targetTypeCode="report"
          targetRefId={draft.id}
          context="global_submission_review"
          panelIdPrefix="global-submission-criteria"
        />
      </section>

      {isSuperAdmin && finalValidationHref ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {t("myReports.globalSubmissionReview.superAdminReportHint")}{" "}
          <Link href={finalValidationHref} className="font-semibold underline">
            {t("myReports.globalSubmissionReview.openFinalValidation")}
          </Link>
        </p>
      ) : null}

      <section className="min-h-[200px]">
        <h2 className="mb-3 text-sm font-semibold text-form-text">
          {t("myReports.globalRevisionReview.tabs.reportPreview")}
        </h2>
        <ReportDraftGeneralPreview draft={draft} />
      </section>

      {globalComments.length > 0 ? (
        <section className="rounded-md border border-form-border bg-form-overlay p-4">
          <h2 className="mb-3 text-sm font-semibold text-form-text">
            {t("myReports.globalSubmissionReview.commentsTitle")}
          </h2>
          <ul className="flex flex-col gap-3">
            {globalComments.map((c) => (
              <li
                key={c.id}
                className="rounded-md border border-form-border bg-form-surface p-3 text-sm"
              >
                <p className="mb-1 text-xs font-medium text-form-text-muted">
                  {roleLabelFr(c.authorRole)} —{" "}
                  {new Date(c.createdAt).toLocaleString("fr-FR")}
                </p>
                <p className="whitespace-pre-wrap text-form-text">{c.body}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {readOnlyClosed ? (
        <p className="rounded-md border border-form-border bg-form-overlay px-4 py-3 text-sm text-form-text-muted">
          {t("myReports.globalSubmissionReview.readOnlyClosedCycle")}
        </p>
      ) : null}

      {canDecide ? (
        <section className="flex flex-col gap-4 rounded-lg border border-form-border bg-form-overlay p-4">
          <h2 className="text-sm font-semibold text-form-text">
            {t("myReports.globalSubmissionReview.actionsTitle")}
          </h2>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-form-text">
              {t("myReports.globalSubmissionReview.revisionCommentLabel")}
            </span>
            <textarea
              className="min-h-[100px] rounded-md border border-form-border bg-form-surface p-3 text-form-text"
              value={revisionComment}
              onChange={(e) => setRevisionComment(e.target.value)}
              disabled={busy}
              placeholder={t("myReports.globalSubmissionReview.revisionCommentPlaceholder")}
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <FormPanelButton variant="accent" disabled={busy} onClick={onApproveRevision}>
              {t("myReports.globalSubmissionReview.approveRevision")}
            </FormPanelButton>
            <FormPanelButton
              variant="surface"
              disabled={busy || revisionComment.trim().length === 0}
              onClick={onRequestChanges}
            >
              {t("myReports.globalSubmissionReview.requestRevision")}
            </FormPanelButton>
          </div>
        </section>
      ) : (
        <p className="text-sm text-form-text-muted">
          {t("myReports.globalSubmissionReview.alreadyDecided")}
        </p>
      )}

      {err ? (
        <p role="alert" className="text-sm text-rose-700">
          {err}
        </p>
      ) : null}
    </div>
  );
};
