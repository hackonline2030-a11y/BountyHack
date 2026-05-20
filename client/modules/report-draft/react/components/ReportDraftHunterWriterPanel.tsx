"use client";

import { type FC, useMemo, useState } from "react";
import { useT } from "next-i18next/client";
import { useAppDispatch, useAppSelector } from "@store/redux/store";
import { setReportDraftHunterWriter } from "@modules/report-draft/core/useCase/set-hunter-writer.usecase";
import { useReportDraftSession } from "@modules/report-draft/react/context/report-draft-session.context";

const fieldInput =
  "w-full rounded-lg border border-form-border bg-white px-3 py-2 text-sm text-form-text shadow-sm focus:border-form-accent focus:outline-none focus:ring-1 focus:ring-form-accent";

/**
 * Shows who may edit/submit the draft and lets squad hunters hand off the writer role.
 */
export const ReportDraftHunterWriterPanel: FC = () => {
  const { t } = useT("myReports");
  const dispatch = useAppDispatch();
  const { viewerUserId, isDesignatedStepWriter } = useReportDraftSession();
  const draftId = useAppSelector((s) => s.reportDrafts.currentDraftId);
  const draft = useAppSelector((s) => (draftId ? s.reportDrafts.byId[draftId] : undefined));
  const transition = useAppSelector((s) => s.reportDrafts.transition);

  const [selectedUserId, setSelectedUserId] = useState("");

  const hunters = useMemo(() => {
    const members = draft?.reportTeam?.members ?? [];
    return members.filter((m) => m.role === "hunter");
  }, [draft?.reportTeam?.members]);

  const writerId = draft?.hunterWriterId ?? draft?.hunterId ?? "";
  const writerName = useMemo(() => {
    const members = draft?.reportTeam?.members;
    if (!members?.length) return writerId;
    return members.find((m) => m.userId === writerId)?.displayName ?? writerId;
  }, [draft?.reportTeam?.members, writerId]);

  const canTransfer =
    draftId &&
    hunters.length > 1 &&
    isDesignatedStepWriter &&
    hunters.some((h) => h.userId === viewerUserId);

  const busy = transition.status === "loading";

  if (!draft || !draft.reportTeam) {
    return null;
  }

  return (
    <div
      className="rounded-lg border border-dashboard-card-border bg-dashboard-accent-soft/30 p-4 text-sm"
      aria-labelledby="hunter-writer-heading"
    >
      <h3
        id="hunter-writer-heading"
        className="text-sm font-semibold text-form-text"
      >
        {t("myReports.workspace.hunterWriter.title")}
      </h3>
      <p className="mt-2 text-form-text-muted">
        {t("myReports.workspace.hunterWriter.current", { name: String(writerName) })}
      </p>
      {isDesignatedStepWriter ? (
        <p className="mt-1 text-emerald-800">
          {t("myReports.workspace.hunterWriter.youAreWriter")}
        </p>
      ) : (
        <p className="mt-1 text-amber-900">
          {t("myReports.workspace.hunterWriter.readOnly", {
            name: String(writerName),
          })}
        </p>
      )}

      {canTransfer ? (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <label htmlFor="hunter-writer-select" className="text-xs text-form-text-muted">
              {t("myReports.workspace.hunterWriter.transferLabel")}
            </label>
            <select
              id="hunter-writer-select"
              className={fieldInput}
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              disabled={busy}
            >
              <option value="">{t("myReports.workspace.hunterWriter.pickPlaceholder")}</option>
              {hunters.map((h) => (
                <option key={h.userId} value={h.userId}>
                  {h.displayName} {h.userId === writerId ? "★" : ""}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className="rounded-md border border-form-accent bg-form-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            disabled={
              busy ||
              !selectedUserId.trim() ||
              selectedUserId === writerId
            }
            onClick={() => {
              if (!draftId || !selectedUserId.trim()) return;
              void dispatch(
                setReportDraftHunterWriter({
                  draftId,
                  hunterWriterId: selectedUserId.trim(),
                }),
              );
            }}
          >
            {busy
              ? t("myReports.workspace.hunterWriter.transferring")
              : t("myReports.workspace.hunterWriter.transferButton")}
          </button>
        </div>
      ) : null}
    </div>
  );
};
