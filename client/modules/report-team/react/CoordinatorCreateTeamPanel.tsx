"use client";

import { useMemo, useState, type FC } from "react";
import { useT } from "next-i18next/client";
import { createReportTeam } from "@modules/report-team/core/useCase/create-report-team.usecase";
import { decideJoinRequest } from "@modules/report-team/core/useCase/decide-join-request.usecase";
import type {
  ReportTeamJoinRequest,
  ReportTeamMemberRole,
} from "@modules/report-team/model/report-team.types";
import { ReportTeamValidityBadge } from "@modules/report-team/react/ReportTeamValidityBadge";
import { computeTeamValidityFromRoles } from "@modules/report-team/core/validity";
import { useAppDispatch, useAppSelector } from "@store/redux/store";

type SelectedMember = {
  userId: string;
  displayName: string;
  role: ReportTeamMemberRole;
};

type Props = {
  pendingJoinRequests: ReadonlyArray<ReportTeamJoinRequest>;
  isReady: boolean;
};

const fieldLabel =
  "text-xs font-medium uppercase tracking-wide text-dashboard-text-muted";
const fieldInput =
  "w-full rounded-lg border border-dashboard-card-border bg-white px-3 py-2 text-sm text-dashboard-text shadow-sm focus:border-dashboard-accent focus:outline-none focus:ring-1 focus:ring-dashboard-accent";

export const CoordinatorCreateTeamPanel: FC<Props> = ({
  pendingJoinRequests,
  isReady,
}) => {
  const dispatch = useAppDispatch();
  const { t } = useT("reportTeams");
  const { mutationStatus, mutationError } = useAppSelector((s) => s.reportTeams);

  const [label, setLabel] = useState("");
  const [selected, setSelected] = useState<SelectedMember[]>([]);
  const [feedback, setFeedback] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const roleLabels: Record<ReportTeamMemberRole, string> = {
    hunter: t("reportTeams.roles.hunter"),
    quality_checker: t("reportTeams.roles.quality_checker"),
    mentor: t("reportTeams.roles.mentor"),
    super_admin: t("reportTeams.roles.super_admin"),
  };

  const applicants = useMemo(() => {
    const byUser = new Map<string, ReportTeamJoinRequest>();
    for (const req of pendingJoinRequests) {
      const uid = req.userId ?? "";
      if (!uid || byUser.has(uid)) continue;
      byUser.set(uid, req);
    }
    return [...byUser.values()];
  }, [pendingJoinRequests]);

  const previewValidity = computeTeamValidityFromRoles(
    selected.map((m) => m.role),
  );
  const successMessage = t("reportTeams.coordinator.create.success");
  const isBusy = !isReady || mutationStatus === "loading" || rejectingId !== null;

  function isSelected(userId: string) {
    return selected.some((m) => m.userId === userId);
  }

  function toggleApplicant(req: ReportTeamJoinRequest) {
    if (isBusy) return;
    const userId = req.userId ?? "";
    if (!userId) return;
    if (isSelected(userId)) {
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

  async function onReject(req: ReportTeamJoinRequest) {
    if (isBusy) return;
    setFeedback("");
    setRejectingId(req.id);
    try {
      await dispatch(decideJoinRequest({ requestId: req.id, decision: "reject" }));
      setSelected((prev) => prev.filter((m) => m.userId !== req.userId));
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : String(error));
    } finally {
      setRejectingId(null);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isBusy) return;
    setFeedback("");
    if (!label.trim()) {
      setFeedback(t("reportTeams.coordinator.create.errorLabel"));
      return;
    }
    if (selected.length === 0) {
      setFeedback(t("reportTeams.coordinator.create.errorMembers"));
      return;
    }
    try {
      await dispatch(
        createReportTeam({
          label: label.trim(),
          members: selected.map((m) => ({ userId: m.userId, role: m.role })),
        }),
      );
      setLabel("");
      setSelected([]);
      setFeedback(successMessage);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="dashboard-card p-4 sm:p-5" aria-labelledby="coord-applicants">
        <h2 id="coord-applicants" className="text-base font-semibold text-dashboard-text">
          {t("reportTeams.coordinator.applicantsTitle")}
        </h2>
        <p className="mt-1 text-sm text-dashboard-text-muted">
          {t("reportTeams.coordinator.applicantsDescription")}
        </p>
        {applicants.length === 0 ? (
          <p className="mt-3 text-sm text-dashboard-text-muted">
            {t("reportTeams.coordinator.pendingEmpty")}
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-dashboard-divider text-xs uppercase text-dashboard-text-muted">
                  <th className="px-2 py-2">
                    {t("reportTeams.coordinator.applicants.include")}
                  </th>
                  <th className="px-2 py-2">{t("reportTeams.coordinator.applicants.user")}</th>
                  <th className="px-2 py-2">
                    {t("reportTeams.coordinator.applicants.requestedRole")}
                  </th>
                  <th className="px-2 py-2">
                    {t("reportTeams.coordinator.applicants.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {applicants.map((req) => (
                  <tr key={req.id} className="border-b border-dashboard-divider last:border-0">
                    <td className="px-2 py-2">
                      <input
                        type="checkbox"
                        checked={isSelected(req.userId ?? "")}
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
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        className="btn-common-styles border border-dashboard-card-border bg-white/90 px-3 py-1 text-xs text-dashboard-text disabled:opacity-50"
                        disabled={isBusy}
                        onClick={() => void onReject(req)}
                      >
                        {rejectingId === req.id
                          ? t("reportTeams.coordinator.rejecting")
                          : t("reportTeams.coordinator.reject")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="dashboard-card p-4 sm:p-5" aria-labelledby="coord-create">
        <h2 id="coord-create" className="text-base font-semibold text-dashboard-text">
          {t("reportTeams.coordinator.create.title")}
        </h2>
        <p className="mt-1 text-sm text-dashboard-text-muted">
          {t("reportTeams.coordinator.create.description")}
        </p>
        <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1">
            <label htmlFor="team-label" className={fieldLabel}>
              {t("reportTeams.coordinator.create.labelField")}
            </label>
            <input
              id="team-label"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className={fieldInput}
              placeholder={t("reportTeams.coordinator.create.labelPlaceholder")}
              disabled={isBusy}
            />
          </div>

          {selected.length > 0 ? (
            <div className="flex flex-col gap-2">
              <p className={fieldLabel}>{t("reportTeams.coordinator.create.membersField")}</p>
              <ul className="flex flex-col gap-2">
                {selected.map((member) => (
                  <li
                    key={member.userId}
                    className="flex flex-wrap items-center gap-2 rounded-lg border border-dashboard-card-border p-3"
                  >
                    <span className="min-w-0 flex-1 text-sm font-medium text-dashboard-text">
                      {member.displayName}
                    </span>
                    <span
                      className="rounded-full bg-dashboard-accent-soft px-2.5 py-1 text-xs text-dashboard-text"
                      aria-label={t("reportTeams.coordinator.applicants.requestedRole")}
                    >
                      {roleLabels[member.role]}
                    </span>
                  </li>
                ))}
              </ul>
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

          <button
            type="submit"
            disabled={isBusy}
            className="btn-common-styles btn-primary inline-flex w-fit items-center gap-2 disabled:opacity-50"
          >
            {mutationStatus === "loading" ? (
              <>
                <span
                  className="inline-block size-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                  aria-hidden
                />
                {t("reportTeams.coordinator.create.submitting")}
              </>
            ) : (
              t("reportTeams.coordinator.create.submit")
            )}
          </button>
        </form>
      </section>
    </div>
  );
};
