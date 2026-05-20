"use client";

import { useEffect, useMemo, useState, type FC } from "react";
import { useT } from "next-i18next/client";
import { createReportTeam } from "@modules/report-team/core/useCase/create-report-team.usecase";
import { decideJoinRequest } from "@modules/report-team/core/useCase/decide-join-request.usecase";
import type {
  ReportTeamJoinRequest,
  ReportTeamMemberRole,
} from "@modules/report-team/model/report-team.types";
import { isEnrollmentJoinRequest } from "@modules/report-team/model/report-team-join-request.utils";
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
  const [designatedWriterUserId, setDesignatedWriterUserId] = useState("");
  const [feedback, setFeedback] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const roleLabels: Record<ReportTeamMemberRole, string> = {
    hunter: t("reportTeams.roles.hunter"),
    quality_checker: t("reportTeams.roles.quality_checker"),
    mentor: t("reportTeams.roles.mentor"),
    super_admin: t("reportTeams.roles.super_admin"),
  };

  const joinExistingTeamRequests = useMemo(
    () =>
      pendingJoinRequests
        .filter((req) => !isEnrollmentJoinRequest(req))
        .slice()
        .sort((a, b) => a.requestedAt.localeCompare(b.requestedAt)),
    [pendingJoinRequests],
  );

  const enrollmentApplicants = useMemo(() => {
    const byUser = new Map<string, ReportTeamJoinRequest>();
    for (const req of pendingJoinRequests) {
      if (!isEnrollmentJoinRequest(req)) continue;
      const uid = req.userId ?? "";
      if (!uid || byUser.has(uid)) continue;
      byUser.set(uid, req);
    }
    return [...byUser.values()];
  }, [pendingJoinRequests]);

  const huntersInTeam = useMemo(
    () => selected.filter((m) => m.role === "hunter"),
    [selected],
  );

  useEffect(() => {
    if (huntersInTeam.length === 0) {
      setDesignatedWriterUserId("");
      return;
    }
    setDesignatedWriterUserId((prev) =>
      prev && huntersInTeam.some((h) => h.userId === prev)
        ? prev
        : huntersInTeam[0]!.userId,
    );
  }, [huntersInTeam]);

  const previewValidity = computeTeamValidityFromRoles(
    selected.map((m) => m.role),
  );
  const successMessage = t("reportTeams.coordinator.create.success");
  const isBusy =
    !isReady || mutationStatus === "loading" || rejectingId !== null || approvingId !== null;

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

  async function onApprove(req: ReportTeamJoinRequest) {
    if (isBusy) return;
    setFeedback("");
    setApprovingId(req.id);
    try {
      await dispatch(decideJoinRequest({ requestId: req.id, decision: "approve" }));
      setSelected((prev) => prev.filter((m) => m.userId !== req.userId));
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : String(error));
    } finally {
      setApprovingId(null);
    }
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
    const hunters = selected.filter((m) => m.role === "hunter");
    if (hunters.length > 1) {
      const ok =
        designatedWriterUserId.trim() !== "" &&
        hunters.some((h) => h.userId === designatedWriterUserId);
      if (!ok) {
        setFeedback(t("reportTeams.coordinator.create.errorWriter"));
        return;
      }
    }
    try {
      const payload: {
        label: string;
        members: Array<{ userId: string; role: ReportTeamMemberRole }>;
        hunterWriterUserId?: string;
      } = {
        label: label.trim(),
        members: selected.map((m) => ({ userId: m.userId, role: m.role })),
      };
      if (hunters.length >= 1) {
        payload.hunterWriterUserId =
          hunters.length > 1
            ? designatedWriterUserId
            : designatedWriterUserId || hunters[0]!.userId;
      }
      await dispatch(createReportTeam(payload));
      setLabel("");
      setSelected([]);
      setFeedback(successMessage);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="coord-join-existing">
        <h2 id="coord-join-existing" className="text-base font-semibold text-dashboard-text">
          {t("reportTeams.coordinator.existingTeamRequestsTitle")}
        </h2>
        <p className="mt-1 text-sm text-dashboard-text-muted">
          {t("reportTeams.coordinator.existingTeamRequestsDescription")}
        </p>
        {joinExistingTeamRequests.length === 0 ? (
          <p className="mt-3 text-sm text-dashboard-text-muted">
            {t("reportTeams.coordinator.existingTeamRequestsEmpty")}
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-dashboard-divider text-xs uppercase text-dashboard-text-muted">
                  <th className="px-2 py-2">{t("reportTeams.coordinator.applicants.team")}</th>
                  <th className="px-2 py-2">{t("reportTeams.coordinator.reportDraftId")}</th>
                  <th className="px-2 py-2">{t("reportTeams.coordinator.applicants.user")}</th>
                  <th className="px-2 py-2">
                    {t("reportTeams.coordinator.applicants.requestedRole")}
                  </th>
                  <th className="px-2 py-2">{t("reportTeams.coordinator.applicants.message")}</th>
                  <th className="px-2 py-2">{t("reportTeams.coordinator.applicants.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {joinExistingTeamRequests.map((req) => (
                  <tr key={req.id} className="border-b border-dashboard-divider last:border-0">
                    <td className="px-2 py-2 font-medium text-dashboard-text">
                      {req.teamLabel || "—"}
                    </td>
                    <td className="max-w-40 px-2 py-2 font-mono text-xs text-dashboard-text-muted">
                      {req.reportDraftId ?? "—"}
                    </td>
                    <td className="px-2 py-2 text-dashboard-text">
                      {req.requesterDisplayName ?? req.userId}
                    </td>
                    <td className="px-2 py-2 text-dashboard-text-muted">
                      {roleLabels[req.requestedRole]}
                    </td>
                    <td
                      className="max-w-48 truncate px-2 py-2 text-dashboard-text-muted"
                      title={req.message?.trim() || undefined}
                    >
                      {req.message?.trim() ? req.message.trim() : "—"}
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="btn-common-styles bg-dashboard-accent px-3 py-1 text-xs text-white disabled:opacity-50"
                          disabled={isBusy}
                          onClick={() => void onApprove(req)}
                        >
                          {approvingId === req.id
                            ? t("reportTeams.coordinator.approving")
                            : t("reportTeams.coordinator.approve")}
                        </button>
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="coord-applicants">
        <h2 id="coord-applicants" className="text-base font-semibold text-dashboard-text">
          {t("reportTeams.coordinator.applicantsTitle")}
        </h2>
        <p className="mt-1 text-sm text-dashboard-text-muted">
          {t("reportTeams.coordinator.applicantsDescription")}
        </p>
        {enrollmentApplicants.length === 0 ? (
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
                {enrollmentApplicants.map((req) => (
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

      <section
        className="border-t border-dashboard-divider pt-6"
        aria-labelledby="coord-create"
      >
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
              {huntersInTeam.length > 0 ? (
                <div className="flex flex-col gap-1">
                  <label htmlFor="coord-designated-writer" className={fieldLabel}>
                    {t("reportTeams.coordinator.create.writerField")}
                  </label>
                  <select
                    id="coord-designated-writer"
                    className={fieldInput}
                    value={designatedWriterUserId}
                    onChange={(e) => setDesignatedWriterUserId(e.target.value)}
                    disabled={isBusy}
                  >
                    {huntersInTeam.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.displayName}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-dashboard-text-muted">
                    {t("reportTeams.coordinator.create.writerHint")}
                  </p>
                </div>
              ) : null}
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

          <ActionButton
            type="submit"
            variant="primary"
            disabled={isBusy}
            className="inline-flex w-fit items-center gap-2"
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
          </ActionButton>
        </form>
      </section>
    </div>
  );
};
