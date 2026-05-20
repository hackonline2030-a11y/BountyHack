"use client";

import { useEffect, useMemo, useState, type FC } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useStore } from "react-redux";
import { useT } from "next-i18next/client";
import { loadCoordinatorTeamDetail } from "@modules/report-team/core/useCase/load-coordinator-team-detail.usecase";
import { loadCoordinatorHunterUsers } from "@modules/report-team/core/useCase/load-coordinator-hunter-users.usecase";
import type { CoordinatorHunterUserOption } from "@modules/report-team/core/useCase/load-coordinator-hunter-users.usecase";
import { loadCoordinatorTeams } from "@modules/report-team/core/useCase/load-coordinator-teams.usecase";
import { removeMemberFromReportTeamAsCoordinator } from "@modules/report-team/core/useCase/remove-member-from-report-team-as-coordinator.usecase";
import { setReportDraftHunterWriter } from "@modules/report-draft/core/useCase/set-hunter-writer.usecase";
import { setReportDraftPrimaryHunter } from "@modules/report-draft/core/useCase/set-primary-hunter.usecase";
import { reportTeamsSlice } from "@modules/report-team/core/store/report-teams.slice";
import type { ReportTeamMemberRole } from "@modules/report-team/model/report-team.types";
import { ReportTeamValidityBadge } from "@modules/report-team/react/ReportTeamValidityBadge";
import type { AppState } from "@store/redux/store";
import { useAppDispatch, useAppSelector } from "@store/redux/store";

const fieldInput =
  "w-full rounded-lg border border-dashboard-card-border bg-white px-3 py-2 text-sm text-dashboard-text shadow-sm focus:border-dashboard-accent focus:outline-none focus:ring-1 focus:ring-dashboard-accent";

type Props = {
  teamId: string;
};

export const CoordinatorTeamDetailPanel: FC<Props> = ({ teamId }) => {
  const dispatch = useAppDispatch();
  const store = useStore();
  const { t } = useT("reportTeams");
  const params = useParams<{ lng?: string }>();
  const lng =
    typeof params?.lng === "string" && params.lng.trim() !== "" ? params.lng : "fr";
  const prefix = `/${lng}`;

  const { teamDetail, teamDetailStatus, teamDetailError, mutationStatus, mutationError } =
    useAppSelector((s) => s.reportTeams);

  const [feedback, setFeedback] = useState("");
  const [primaryFeedback, setPrimaryFeedback] = useState("");
  const [memberFeedback, setMemberFeedback] = useState("");
  const [selectedWriterId, setSelectedWriterId] = useState("");
  const [selectedPrimaryHunterId, setSelectedPrimaryHunterId] = useState("");
  const [hunterPicker, setHunterPicker] = useState<CoordinatorHunterUserOption[]>([]);

  const team = teamDetail?.id === teamId ? teamDetail : null;

  const roleLabels: Record<ReportTeamMemberRole, string> = {
    hunter: t("reportTeams.roles.hunter"),
    quality_checker: t("reportTeams.roles.quality_checker"),
    mentor: t("reportTeams.roles.mentor"),
    super_admin: t("reportTeams.roles.super_admin"),
  };

  const hunters = useMemo(
    () => team?.members.filter((m) => m.role === "hunter") ?? [],
    [team?.members],
  );

  useEffect(() => {
    dispatch(reportTeamsSlice.actions.teamDetailReset());
    void dispatch(loadCoordinatorTeamDetail(teamId));
    void dispatch(loadCoordinatorHunterUsers()).then((rows) => {
      if (Array.isArray(rows)) {
        setHunterPicker(rows);
      }
    });
    return () => {
      dispatch(reportTeamsSlice.actions.teamDetailReset());
    };
  }, [dispatch, teamId]);

  useEffect(() => {
    if (team?.hunterWriterUserId) {
      setSelectedWriterId(team.hunterWriterUserId);
    }
  }, [team?.hunterWriterUserId]);

  useEffect(() => {
    if (team?.reportDraftOwnerUserId) {
      setSelectedPrimaryHunterId(team.reportDraftOwnerUserId);
    }
  }, [team?.reportDraftOwnerUserId]);

  async function onSavePrimaryHunter() {
    if (!team) return;
    const next = selectedPrimaryHunterId.trim();
    if (!next || next === team.reportDraftOwnerUserId) return;
    setPrimaryFeedback("");
    try {
      await dispatch(
        setReportDraftPrimaryHunter({
          draftId: team.reportDraftId,
          hunterId: next,
        }),
      );
      const tr = (store.getState() as AppState).reportDrafts.transition;
      if (tr.status === "error") {
        setPrimaryFeedback(tr.message);
        return;
      }
      setPrimaryFeedback(t("reportTeams.coordinator.teamDetail.primaryHunterSaved"));
      await dispatch(loadCoordinatorTeamDetail(teamId));
      await dispatch(loadCoordinatorTeams());
    } catch {
      const tr = (store.getState() as AppState).reportDrafts.transition;
      if (tr.status === "error") {
        setPrimaryFeedback(tr.message);
      }
    }
  }

  async function onSaveWriter() {
    if (!team || hunters.length === 0) return;
    const next = selectedWriterId.trim();
    if (!next || next === team.hunterWriterUserId) return;
    setFeedback("");
    await dispatch(
      setReportDraftHunterWriter({
        draftId: team.reportDraftId,
        hunterWriterId: next,
      }),
    );
    const tr = (store.getState() as AppState).reportDrafts.transition;
    if (tr.status === "error") {
      setFeedback(tr.message);
      return;
    }
    setFeedback(t("reportTeams.coordinator.teamDetail.writerSaved"));
    await dispatch(loadCoordinatorTeamDetail(teamId));
    await dispatch(loadCoordinatorTeams());
  }

  const transition = useAppSelector((s) => s.reportDrafts.transition);
  const teamPageLoading = teamDetailStatus === "loading";
  const writerBusy = transition.status === "loading" || teamPageLoading;
  const memberBusy = mutationStatus === "loading" || teamPageLoading;

  async function onRemoveMember(memberUserId: string, displayName: string) {
    if (!team) return;
    const ok = window.confirm(
      t("reportTeams.coordinator.teamDetail.membersRemoveConfirm", { name: displayName }),
    );
    if (!ok) return;
    setMemberFeedback("");
    try {
      await dispatch(
        removeMemberFromReportTeamAsCoordinator({ teamId: team.id, memberUserId }),
      );
      setMemberFeedback(t("reportTeams.coordinator.teamDetail.membersRemoved"));
    } catch {
      /* mutationFailed sets global mutationError */
    }
  }

  if (teamDetailStatus === "loading" && !team) {
    return (
      <div
        className="flex flex-col items-center gap-3 py-12"
        role="status"
        aria-live="polite"
      >
        <span
          className="inline-block size-8 animate-spin rounded-full border-2 border-dashboard-accent border-t-transparent"
          aria-hidden
        />
        <p className="text-sm text-dashboard-text-muted">
          {t("reportTeams.coordinator.teamDetail.loading")}
        </p>
      </div>
    );
  }

  if (teamDetailStatus === "error" || !team) {
    const msg =
      teamDetailError === "TEAM_NOT_FOUND"
        ? t("reportTeams.coordinator.teamDetail.notFound")
        : teamDetailError ?? t("reportTeams.coordinator.teamDetail.loadError");
    return (
      <p className="text-sm text-red-600" role="alert">
        {msg}
      </p>
    );
  }

  const writerName =
    team.members.find((m) => m.userId === team.hunterWriterUserId)?.displayName ??
    team.hunterWriterUserId;

  const primaryHunterName =
    hunterPicker.find((h) => h.userId === team.reportDraftOwnerUserId)?.displayName ??
    team.members.find((m) => m.userId === team.reportDraftOwnerUserId)?.displayName ??
    team.reportDraftOwnerUserId;

  const selectableHunters = hunterPicker.filter(
    (h) => h.userId !== team.reportDraftOwnerUserId,
  );

  return (
    <div className="flex flex-col gap-6">
      <Link href={`${prefix}/coordination`} className="dashboard-card-cta w-fit text-sm">
        ← {t("reportTeams.coordinator.teamDetail.back")}
      </Link>

      {mutationError ? (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          {mutationError}
        </p>
      ) : null}

      <header>
        <h1 className="text-2xl font-bold tracking-tight text-dashboard-text sm:text-3xl">
          {team.label}
        </h1>
        <p className="mt-1 font-mono text-xs text-dashboard-text-muted">{team.id}</p>
      </header>

      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm text-dashboard-text-muted">
            {t("reportTeams.coordinator.reportDraftId")}
          </p>
          <p className="mt-0.5 font-mono text-xs text-dashboard-text">{team.reportDraftId}</p>
          <p className="mt-2 text-xs text-dashboard-text-muted">
            {t("reportTeams.coordinator.teamDetail.draftIdHint")}
          </p>
        </div>
        <ReportTeamValidityBadge
          validity={team.validity}
          validLabel={t("reportTeams.validity.valid")}
          incompleteLabel={t("reportTeams.validity.incomplete")}
        />
      </div>

      <section aria-labelledby="coord-team-members">
        <h2 id="coord-team-members" className="text-base font-semibold text-dashboard-text">
          {t("reportTeams.myTeams.members")}
        </h2>
        {team.members.length === 0 ? (
          <p className="mt-2 text-sm text-dashboard-text">—</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {team.members.map((m) => {
              const isPrimaryHunter = m.userId === team.reportDraftOwnerUserId;
              return (
                <li
                  key={m.userId}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashboard-card-border bg-white px-3 py-2"
                >
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-dashboard-text">{m.displayName}</span>
                    <span className="ml-2 text-xs text-dashboard-text-muted">
                      ({roleLabels[m.role]})
                    </span>
                    {isPrimaryHunter ? (
                      <p className="mt-0.5 text-xs text-dashboard-text-subtle">
                        {t("reportTeams.coordinator.teamDetail.membersPrimaryHunter")}
                      </p>
                    ) : null}
                  </div>
                  {!isPrimaryHunter ? (
                    <button
                      type="button"
                      className="shrink-0 rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-900 hover:bg-red-100 disabled:opacity-50"
                      disabled={memberBusy}
                      onClick={() => void onRemoveMember(m.userId, m.displayName)}
                    >
                      {memberBusy
                        ? t("reportTeams.coordinator.teamDetail.membersRemoveBusy")
                        : t("reportTeams.coordinator.teamDetail.membersRemove")}
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
        {memberFeedback ? (
          <p className="mt-2 text-sm text-dashboard-text" role="status">
            {memberFeedback}
          </p>
        ) : null}
      </section>

      <section
        className="rounded-lg border border-dashboard-card-border bg-dashboard-accent-soft/20 p-4"
        aria-labelledby="coord-primary-hunter"
      >
        <h2
          id="coord-primary-hunter"
          className="text-base font-semibold text-dashboard-text"
        >
          {t("reportTeams.coordinator.teamDetail.primaryHunterSectionTitle")}
        </h2>
        <p className="mt-1 text-sm text-dashboard-text-muted">
          {t("reportTeams.coordinator.teamDetail.primaryHunterSectionHint")}
        </p>
        <p className="mt-3 text-sm text-dashboard-text">
          {t("reportTeams.coordinator.teamDetail.currentPrimaryHunter", {
            name: primaryHunterName,
          })}
        </p>

        {selectableHunters.length > 0 ? (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <label
                htmlFor="coord-primary-hunter-select"
                className="text-xs text-dashboard-text-muted"
              >
                {t("reportTeams.coordinator.teamDetail.primaryHunterLabel")}
              </label>
              <select
                id="coord-primary-hunter-select"
                className={fieldInput}
                value={selectedPrimaryHunterId}
                onChange={(e) => setSelectedPrimaryHunterId(e.target.value)}
                disabled={writerBusy}
              >
                {hunterPicker.map((h) => (
                  <option key={h.userId} value={h.userId}>
                    {h.displayName}
                    {h.userId === team.reportDraftOwnerUserId ? " ★" : ""}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="rounded-md border border-dashboard-accent bg-dashboard-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              disabled={
                writerBusy ||
                !selectedPrimaryHunterId.trim() ||
                selectedPrimaryHunterId === team.reportDraftOwnerUserId
              }
              onClick={() => void onSavePrimaryHunter()}
            >
              {writerBusy
                ? t("reportTeams.coordinator.teamDetail.primaryHunterSaving")
                : t("reportTeams.coordinator.teamDetail.primaryHunterSave")}
            </button>
          </div>
        ) : (
          <p className="mt-3 text-sm text-amber-800">
            {t("reportTeams.coordinator.teamDetail.primaryHunterNeedAnother")}
          </p>
        )}

        {primaryFeedback ? (
          <p className="mt-3 text-sm text-dashboard-text" role="status">
            {primaryFeedback}
          </p>
        ) : null}
      </section>

      <section
        className="rounded-lg border border-dashboard-card-border bg-dashboard-accent-soft/20 p-4"
        aria-labelledby="coord-writer"
      >
        <h2 id="coord-writer" className="text-base font-semibold text-dashboard-text">
          {t("reportTeams.coordinator.teamDetail.writerSectionTitle")}
        </h2>
        <p className="mt-1 text-sm text-dashboard-text-muted">
          {t("reportTeams.coordinator.teamDetail.writerSectionHint")}
        </p>
        <p className="mt-3 text-sm text-dashboard-text">
          {t("reportTeams.coordinator.teamDetail.currentWriter", { name: writerName })}
        </p>

        {hunters.length > 0 ? (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <label htmlFor="coord-writer-select" className="text-xs text-dashboard-text-muted">
                {t("reportTeams.coordinator.teamDetail.writerLabel")}
              </label>
              <select
                id="coord-writer-select"
                className={fieldInput}
                value={selectedWriterId}
                onChange={(e) => setSelectedWriterId(e.target.value)}
                disabled={writerBusy}
              >
                {hunters.map((h) => (
                  <option key={h.userId} value={h.userId}>
                    {h.displayName}
                    {h.userId === team.hunterWriterUserId ? " ★" : ""}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="rounded-md border border-dashboard-accent bg-dashboard-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              disabled={
                writerBusy ||
                !selectedWriterId.trim() ||
                selectedWriterId === team.hunterWriterUserId
              }
              onClick={() => void onSaveWriter()}
            >
              {writerBusy
                ? t("reportTeams.coordinator.teamDetail.saving")
                : t("reportTeams.coordinator.teamDetail.save")}
            </button>
          </div>
        ) : (
          <p className="mt-3 text-sm text-amber-800">
            {t("reportTeams.coordinator.teamDetail.noHunters")}
          </p>
        )}

        {feedback ? (
          <p className="mt-3 text-sm text-dashboard-text" role="status">
            {feedback}
          </p>
        ) : null}
      </section>
    </div>
  );
};
