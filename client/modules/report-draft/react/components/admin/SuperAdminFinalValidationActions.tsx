"use client";

import Link from "next/link";
import { FormPanelButton } from "@modules/app/nextjs/components/buttons/FormPanelButton";
import { type FC, useCallback, useMemo, useState } from "react";
import { useT } from "next-i18next/client";
import type { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import {
  canApproveFinalValidation,
  canExportReportPdf,
  canRequestFinalRevision,
  findActivePendingGlobalSubmissionForSuperAdmin,
  resolveFinalValidationStatus,
} from "@modules/report-draft/core/model/super-admin-final-validation";
import { approveSuperAdminFinalValidation } from "@modules/report-draft/core/useCase/approve-super-admin-final-validation.usecase";
import { exportReportPdf } from "@modules/report-draft/core/useCase/export-report-pdf.usecase";
import { requestSuperAdminFinalRevision } from "@modules/report-draft/core/useCase/request-super-admin-final-revision.usecase";
import { useAppDispatch, useAppSelector } from "@store/redux/store";

type Props = {
  draft: ReportDraftDomainModel.ReportDraft;
  lng: string;
};

const validatorRoleI18nKey = (
  role: ReportDraftDomainModel.ReviewerRole,
): "roleQualityChecker" | "roleSuperAdmin" =>
  role === "super_admin" ? "roleSuperAdmin" : "roleQualityChecker";

export const SuperAdminFinalValidationActions: FC<Props> = ({ draft, lng }) => {
  const { t } = useT("reportDraft");
  const dispatch = useAppDispatch();
  const transition = useAppSelector((s) => s.reportDrafts.transition);
  const globalSubmissionsById = useAppSelector((s) => s.reportDrafts.globalSubmissionsById);
  const globalSubmissions = useMemo(
    () =>
      Object.values(globalSubmissionsById).filter((g) => g.reportDraftId === draft.id),
    [globalSubmissionsById, draft.id],
  );

  const status = useMemo(
    () => resolveFinalValidationStatus(draft, globalSubmissions),
    [draft, globalSubmissions],
  );

  const pendingGlobalSubmission = useMemo(
    () => findActivePendingGlobalSubmissionForSuperAdmin(draft, globalSubmissions),
    [draft, globalSubmissions],
  );
  const globalSubmissionReviewHref = pendingGlobalSubmission
    ? `/${lng}/administration/global-submissions/${encodeURIComponent(pendingGlobalSubmission.id)}`
    : null;

  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const busy = transition.status === "loading";
  const canApprove = canApproveFinalValidation(draft);
  const canRevision = canRequestFinalRevision(draft, globalSubmissions);
  const canGeneratePdf = canExportReportPdf(draft);

  const statusMessage = useMemo(() => {
    const base = "reportDraft.finalValidation.detail.actions.status";
    switch (status.kind) {
      case "global-cycle-closed":
        return t(`${base}.globalCycleClosed`, {
          revision: status.revision ?? draft.superAdminGlobalRevisionCount ?? 1,
          role: t(
            `${base}.${validatorRoleI18nKey(status.validatorRole ?? "quality_checker")}`,
          ),
        });
      case "global-cycle-open-pending-sa":
        return t(`${base}.globalCycleOpenPendingSa`, { revision: status.revision ?? 1 });
      case "global-cycle-open":
        return t(`${base}.globalCycleOpen`, { revision: status.revision ?? 1 });
      case "submitted":
        return t(`${base}.submitted`);
      case "ready-no-global-yet":
        return t(`${base}.readyNoGlobalYet`);
      default:
        return t(`${base}.awaitingReady`);
    }
  }, [status, draft.superAdminGlobalRevisionCount, t]);

  const statusToneClass =
    status.kind === "global-cycle-closed"
      ? "border-emerald-200 bg-emerald-50 text-emerald-950"
      : status.kind === "global-cycle-open" || status.kind === "global-cycle-open-pending-sa"
        ? "border-violet-200 bg-violet-50 text-violet-950"
        : "border-form-border bg-form-surface text-form-text-muted";

  const onApprove = useCallback(() => {
    void dispatch(approveSuperAdminFinalValidation({ draftId: draft.id }));
  }, [dispatch, draft.id]);

  const onRequestRevision = useCallback(() => {
    void dispatch(requestSuperAdminFinalRevision({ draftId: draft.id }));
  }, [dispatch, draft.id]);

  const onGeneratePdf = useCallback(async () => {
    setPdfError(null);
    setPdfBusy(true);
    try {
      const result = await exportReportPdf({ draftId: draft.id, lang: lng });
      if (!result.ok) {
        setPdfError(result.message);
        return;
      }
      const url = URL.createObjectURL(result.blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename;
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } finally {
      setPdfBusy(false);
    }
  }, [draft.id, lng]);

  const err = transition.status === "error" ? transition.message : null;

  return (
    <section
      className="flex flex-col gap-3 rounded-lg border border-form-border bg-form-overlay p-4"
      aria-labelledby="final-validation-actions-heading"
    >
      <h2 id="final-validation-actions-heading" className="text-sm font-semibold text-form-text">
        {t("reportDraft.finalValidation.detail.actions.heading")}
      </h2>

      <p className={`rounded-md border px-3 py-2 text-sm ${statusToneClass}`}>{statusMessage}</p>

      {globalSubmissionReviewHref ? (
        <p className="text-sm text-violet-950">
          <Link href={globalSubmissionReviewHref} className="font-semibold underline">
            {t("reportDraft.finalValidation.detail.actions.openGlobalSubmissionReview")}
          </Link>
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <FormPanelButton
          variant="accent"
          disabled={!canApprove || busy}
          onClick={onApprove}
          title={
            canApprove
              ? undefined
              : t("reportDraft.finalValidation.detail.actions.approveDisabledTitle")
          }
        >
          {t("reportDraft.finalValidation.detail.actions.approve")}
        </FormPanelButton>
        <FormPanelButton
          variant="surface"
          disabled={!canRevision || busy}
          onClick={onRequestRevision}
          title={
            canRevision
              ? undefined
              : (draft.superAdminGlobalRevisionCount ?? 0) > 0
                ? t("reportDraft.finalValidation.detail.actions.revisionAlreadyUsedTitle")
                : t("reportDraft.finalValidation.detail.actions.revisionDisabledTitle")
          }
        >
          {t("reportDraft.finalValidation.detail.actions.requestRevision")}
        </FormPanelButton>
        <FormPanelButton
          variant="emerald"
          disabled={!canGeneratePdf || busy || pdfBusy}
          onClick={() => void onGeneratePdf()}
          title={
            canGeneratePdf
              ? undefined
              : t("reportDraft.finalValidation.detail.actions.generatePdfDisabledTitle")
          }
        >
          {pdfBusy
            ? t("reportDraft.finalValidation.detail.actions.generatePdfLoading")
            : t("reportDraft.finalValidation.detail.actions.generatePdf")}
        </FormPanelButton>
      </div>
      {pdfError ? (
        <p role="alert" className="text-sm text-rose-700">
          {pdfError}
        </p>
      ) : null}
      {err ? (
        <p role="alert" className="text-sm text-rose-700">
          {err}
        </p>
      ) : null}
    </section>
  );
};
