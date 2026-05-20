"use client";

import { type FC } from "react";
import type { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { iconActionDangerClass } from "@modules/report-team/react/icon-action-buttons";
import { TrashIcon } from "@modules/report-team/react/icons";

type Props = {
  draftId: string;
  attachment: ReportDraftDomainModel.Attachment;
  canDelete: boolean;
  deleting?: boolean;
  onDelete?: () => void;
};

export const ReportDraftAttachmentCard: FC<Props> = ({
  draftId,
  attachment,
  canDelete,
  deleting = false,
  onDelete,
}) => {
  const imageUrl = `/api/report-draft/drafts/${encodeURIComponent(draftId)}/attachments/${encodeURIComponent(attachment.id)}/image`;

  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-form-border bg-white shadow-sm">
      <div className="relative aspect-[4/3] bg-form-overlay">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={attachment.filename}
          className="h-full w-full object-contain"
        />
        {canDelete ? (
          <button
            type="button"
            className={`absolute right-2 top-2 ${iconActionDangerClass}`}
            aria-label={`Supprimer ${attachment.filename}`}
            title="Supprimer"
            disabled={deleting}
            onClick={() => onDelete?.()}
          >
            <TrashIcon className="size-4" />
          </button>
        ) : null}
      </div>
      <div className="flex flex-col gap-1 p-3 text-xs">
        <p className="truncate font-medium text-form-text" title={attachment.filename}>
          {attachment.filename}
        </p>
        <p className="font-mono text-[10px] text-form-text-muted break-all" title={attachment.storageKey}>
          {attachment.storageKey}
        </p>
        <p className="text-form-text-muted">
          {(attachment.sizeBytes / 1024).toFixed(1)} Ko
        </p>
      </div>
    </article>
  );
};
