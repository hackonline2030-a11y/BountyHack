"use client";

import { useMemo, useState, type FC } from "react";
import { useT } from "next-i18next/client";
import { createReportTeam } from "@modules/report-team/core/useCase/create-report-team.usecase";
import type { OrphanReportDraft } from "@modules/report-team/model/orphan-report-draft.types";
import type {
  ReportTeamJoinRequest,
  ReportTeamMemberRole,
} from "@modules/report-team/model/report-team.types";
import { ActionButton } from "@modules/app/nextjs/components/buttons/ActionButton";
import { ReportTeamValidityBadge } from "@modules/report-team/react/ReportTeamValidityBadge";
import { computeTeamValidityFromRoles } from "@modules/report-team/core/validity";
import { useAppDispatch, useAppSelector } from "@store/redux/store";

type SelectedMember = {
  userId: string;
  displayName: string;
  role: ReportTeamMemberRole;
};

type Props = {
  orphan: OrphanReportDraft;
  pendingJoinRequests: ReadonlyArray<ReportTeamJoinRequest>;
  isReady: boolean;
  onCancel: () => void;
};

const fieldLabel =
  "text-xs font-medium uppercase tracking-wide text-dashboard-text-muted";
const fieldInput =
  "w-full rounded-lg border border-dashboard-card-border bg-white px-3 py-2 text-sm text-dashboard-text shadow-sm focus:border-dashboard-accent focus:outline-none focus:ring-1 focus:ring-dashboard-accent";

function isEnrollmentRequest(req: ReportTeamJoinRequest): boolean {
  return req.teamId === undefined || req.teamId === "";
}

export const CoordinatorAttachOrphanTeamPanel: FC<Props> = ({
  orphan,
  pendingJoinRequests,
  isReady,
  onCancel,
}) => {
  const dispatch = useAppDispatch();
  const { t } = useT("reportTeams");
  const { mutationStatus, mutationError } = useAppSelector((s) => s.reportTeams);

  const [label, setLabel] = useState("");
  const [selected, setSelected] = useState<SelectedMember[]>([]);
  const [feedback, setFeedback] = useState("");

  const roleLabels: Record<ReportTeamMemberRole, string> = {
    hunter: t("reportTeams.roles.hunter"),
    quality_checker: t("reportTeams.roles.quality_checker"),
    mentor: t("reportTeams.roles.mentor"),
    super_admin: t("reportTeams.roles.super_admin"),
  };

  const applicants = useMemo(() => {
    const byUser = new Map<string, ReportTeamJoinRequest>();
    for (const req of pendingJoinRequests) {
      if (!isEnrollmentRequest(req)) continue;
      const uid = req.userId ?? "";
      if (!uid || uid === orphan.hunterId || byUser.has(uid)) continue;
      if (req.requestedRole === "hunter") continue;
      byUser.set(uid, req);
    }
    return [...byUser.values()];
  }, [pendingJoinRequests, orphan.hunterId]);

  const previewValidity = computeTeamValidityFromRoles([
    "hunter",
    ...selected.map((m) => m.role),
  ]);
  const successMessage = t("reportTeams.orphanDrafts.attach.success");
  const isBusy = !isReady || mutationStatus === "loading";

  function isChecked(userId: string) {
    return selected.some((m) => m.userId === userId);
  }

  function toggleApplicant(req: ReportTeamJoinRequest) {
    if (isBusy) return;
    const userId = req.userId ?? "";
    if (!userId) return;
    if (isChecked(userId)) {
      setSelected((prev) => prev.filter((m) => m.userId !== userId));
      return;
    }
    setSelected((prev) => [
      ...prev,
      {
        userId,
        displayName: req.requesterDisplayName ?? userId,
        role: req.requestedRole,
      },
    ]);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isBusy) return;
    setFeedback("");
    if (!label.trim()) {
      setFeedback(t("reportTeams.orphanDrafts.attach.errorLabel"));
      return;
    }
    if (selected.length === 0) {
      setFeedback(t("reportTeams.orphanDrafts.attach.errorApplicants"));
      return;
    }
    try {
      await dispatch(
        createReportTeam({
          label: label.trim(),
          reportDraftId: orphan.id,
          members: selected.map((m) => ({ userId: m.userId, role: m.role })),
        }),
      );
      setLabel("");
      setSelected([]);
      setFeedback(successMessage);
      onCancel();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : String(error));
    }
  }

  const reportTitle =
    orphan.reportTitle.trim() || t("reportTeams.orphanDrafts.table.untitled");

  return (
    <div
      className="rounded-lg border border-dashboard-accent/40 bg-dashboard-accent-soft/20 p-4 sm:p-5"
      role="region"
      aria-labelledby="attach-orphan-heading"
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 id="attach-orphan-heading" className="text-base font-semibold text-dashboard-text">
            {t("reportTeams.orphanDrafts.attach.title")}
          </h3>
          <p className="mt-1 text-sm text-dashboard-text">{reportTitle}</p>
          <p className="font-mono text-xs text-dashboard-text-muted">{orphan.id}</p>
        </div>
        <button
          type="button"
          className="text-sm font-medium text-dashboard-accent hover:underline"
          onClick={onCancel}
          disabled={isBusy}
        >
          {t("reportTeams.orphanDrafts.attach.cancel")}
        </button>
      </header>
      <p className="mt-2 text-sm text-dashboard-text-muted">
        {t("reportTeams.orphanDrafts.attach.description")}
      </p>

      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-4" noValidate>
        <div className="rounded-lg border border-dashboard-card-border bg-white/80 px-3 py-2 text-sm">
          <span className={fieldLabel}>{t("reportTeams.orphanDrafts.attach.ownerHunter")}</span>
          <p className="mt-1 font-medium text-dashboard-text">
            {orphan.hunterDisplayName}
            <span className="mt-0.5 block font-mono text-xs font-normal text-dashboard-text-muted">
              {orphan.hunterId}
            </span>
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="orphan-team-label" className={fieldLabel}>
            {t("reportTeams.orphanDrafts.attach.labelField")}
          </label>
          <input
            id="orphan-team-label"
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className={fieldInput}
            placeholder={t("reportTeams.orphanDrafts.attach.labelPlaceholder")}
            disabled={isBusy}
          />
        </div>

        <div>
          <p className={fieldLabel}>{t("reportTeams.orphanDrafts.attach.applicantsTitle")}</p>
          {applicants.length === 0 ? (
            <p className="mt-2 text-sm text-dashboard-text-muted">
              {t("reportTeams.orphanDrafts.attach.applicantsEmpty")}
            </p>
          ) : (
            <ApplicantsTable
              applicants={applicants}
              roleLabels={roleLabels}
              isBusy={isBusy}
              isChecked={isChecked}
              toggleApplicant={toggleApplicant}
              t={t}
            />
          )}
        </div>

        {selected.length > 0 ? (
          <div className="flex items-center gap-2">
            <ReportTeamValidityBadge
              validity={previewValidity}
              validLabel={t("reportTeams.validity.valid")}
              incompleteLabel={t("reportTeams.validity.incomplete")}
            />
            <span className="text-xs text-dashboard-text-muted">
              {t("reportTeams.validity.hint")}
            </span>
          </div>
        ) : null}

        {mutationError || feedback ? (
          <p
            role="alert"
            className={`text-sm ${
              mutationError || feedback !== successMessage
                ? "text-red-600"
                : "text-emerald-700"
            }`}
          >
            {mutationError ?? feedback}
          </p>
        ) : null}

        <ActionButton type="submit" variant="primary" disabled={isBusy} className="w-fit">
          {mutationStatus === "loading"
            ? t("reportTeams.orphanDrafts.attach.submitting")
            : t("reportTeams.orphanDrafts.attach.submit")}
        </ActionButton>
      </form>
    </div>
  );
};

const ApplicantsTable: FC<{
  applicants: ReportTeamJoinRequest[];
  roleLabels: Record<ReportTeamMemberRole, string>;
  isBusy: boolean;
  isChecked: (userId: string) => boolean;
  toggleApplicant: (req: ReportTeamJoinRequest) => void;
  t: ReturnType<typeof useT>[0];
}> = ({ applicants, roleLabels, isBusy, isChecked, toggleApplicant, t }) => (
  <div className="mt-2 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-dashboard-divider text-xs uppercase text-dashboard-text-muted">
              <th className="px-2 py-2">{t("reportTeams.coordinator.applicants.include")}</th>
              <th className="px-2 py-2">{t("reportTeams.coordinator.applicants.user")}</th>
              <th className="px-2 py-2">{t("reportTeams.coordinator.applicants.requestedRole")}</th>
            </tr>
          </thead>
          <tbody>
            {applicants.map((req) => (
              <tr key={req.id} className="border-b border-dashboard-divider last:border-0">
                <td className="px-2 py-2">
                  <input
                    type="checkbox"
                    checked={isChecked(req.userId ?? "")}
                    onChange={() => toggleApplicant(req)}
                    disabled={isBusy}
                    aria-label={req.requesterDisplayName ?? req.userId}
                  />
                </td>
                <td className="px-2 py-2 text-dashboard-text">
                  {req.requesterDisplayName ?? req.userId}
                </td>
                <td className="px-2 py-2 text-dashboard-text-muted">
                  {roleLabels[req.requestedRole]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
  </div>
);