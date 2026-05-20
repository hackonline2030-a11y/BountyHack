"use client";

import { type FC, useCallback, useMemo, useState } from "react";
import { useT } from "next-i18next/client";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { reportDraftStepToStateKey } from "@modules/report-draft/core/model/report-draft-step-keys";
import {
  canDeleteReportDraftAttachment,
  stepSupportsAttachments,
} from "@modules/report-draft/core/model/report-draft-attachment-permissions";
import { deleteReportDraftAttachment } from "@modules/report-draft/core/useCase/delete-report-draft-attachment.usecase";
import { ReportDraftAttachmentCard } from "@modules/report-draft/react/components/attachments/ReportDraftAttachmentCard";
import { useReportDraftSession } from "@modules/report-draft/react/context/report-draft-session.context";
import { useAppDispatch, useAppSelector } from "@store/redux/store";

type Props = {
  step: ReportDraftDomainModel.ReportDraftStep;
  /** When set (QC submission review), show snapshot attachments read-only unless delete allowed on live draft. */
  snapshotAttachments?: ReadonlyArray<ReportDraftDomainModel.Attachment>;
};

export const ReportDraftStepAttachmentsPanel: FC<Props> = ({ step, snapshotAttachments }) => {
  const { t } = useT("myReports");
  const dispatch = useAppDispatch();
  const { viewerUserId, roleCode } = useReportDraftSession();
  const currentDraftId = useAppSelector((s) => s.reportDrafts.currentDraftId);
  const draft = useAppSelector((s) =>
    currentDraftId ? s.reportDrafts.byId[currentDraftId] : undefined,
  );
  const submissionsById = useAppSelector((s) => s.reportDrafts.submissionsById);
  const transition = useAppSelector((s) => s.reportDrafts.transition);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const stepKey = reportDraftStepToStateKey(step);
  const liveAttachments = draft?.[stepKey]?.attachments ?? [];
  const attachments = snapshotAttachments ?? liveAttachments;

  const canDelete = useMemo(
    () =>
      !snapshotAttachments &&
      canDeleteReportDraftAttachment({
        viewerUserId,
        roleCode,
        draft,
        step,
        submissions: Object.values(submissionsById),
      }),
    [snapshotAttachments, viewerUserId, roleCode, draft, step, submissionsById],
  );

  const onDelete = useCallback(
    (attachmentId: string) => {
      if (!currentDraftId || !canDelete) return;
      setDeletingId(attachmentId);
      void dispatch(
        deleteReportDraftAttachment({ draftId: currentDraftId, attachmentId }),
      ).finally(() => setDeletingId(null));
    },
    [canDelete, currentDraftId, dispatch],
  );

  if (!stepSupportsAttachments(step)) {
    return (
      <p className="text-sm text-form-text-muted">
        {t("myReports.workspace.attachments.noStepImages")}
      </p>
    );
  }

  if (attachments.length === 0) {
    return (
      <p className="text-sm text-form-text-muted">
        {t("myReports.workspace.attachments.empty")}
      </p>
    );
  }

  const transitionBusy = transition.status === "loading";

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-form-text-muted">
        {t("myReports.workspace.attachments.hint")}
      </p>
      {transition.status === "error" ? (
        <p role="alert" className="text-sm text-rose-800">
          {transition.message}
        </p>
      ) : null}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {attachments.map((attachment) => (
          <ReportDraftAttachmentCard
            key={attachment.id}
            draftId={currentDraftId ?? ""}
            attachment={attachment}
            canDelete={canDelete}
            deleting={deletingId === attachment.id || transitionBusy}
            onDelete={() => onDelete(attachment.id)}
          />
        ))}
      </div>
    </div>
  );
};
