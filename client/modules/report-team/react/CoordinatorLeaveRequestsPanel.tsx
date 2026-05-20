"use client";

import { useState, type FC } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useT } from "next-i18next/client";
import { decideLeaveRequest } from "@modules/report-team/core/useCase/decide-leave-request.usecase";
import type { ReportTeamLeaveRequest } from "@modules/report-team/model/report-team.types";
import { ActionButton } from "@modules/app/nextjs/components/buttons/ActionButton";
import { useAppDispatch, useAppSelector } from "@store/redux/store";

type Props = {
  pendingLeaveRequests: ReadonlyArray<ReportTeamLeaveRequest>;
  isReady: boolean;
};

export const CoordinatorLeaveRequestsPanel: FC<Props> = ({
  pendingLeaveRequests,
  isReady,
}) => {
  const dispatch = useAppDispatch();
  const { t } = useT("reportTeams");
  const params = useParams<{ lng?: string }>();
  const lng = typeof params?.lng === "string" && params.lng.trim() !== "" ? params.lng : "fr";
  const { mutationStatus } = useAppSelector((s) => s.reportTeams);

  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");

  const isBusy =
    !isReady || mutationStatus === "loading" || approvingId !== null || rejectingId !== null;

  const dateFormatter = new Intl.DateTimeFormat(lng, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  async function onApprove(req: ReportTeamLeaveRequest) {
    if (isBusy) return;
    setFeedback("");
    setApprovingId(req.id);
    try {
      await dispatch(decideLeaveRequest({ requestId: req.id, decision: "approve" }));
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : String(error));
    } finally {
      setApprovingId(null);
    }
  }

  async function onReject(req: ReportTeamLeaveRequest) {
    if (isBusy) return;
    setFeedback("");
    setRejectingId(req.id);
    try {
      await dispatch(decideLeaveRequest({ requestId: req.id, decision: "reject" }));
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : String(error));
    } finally {
      setRejectingId(null);
    }
  }

  return (
    <section aria-labelledby="coord-leave-requests">
      <h2 id="coord-leave-requests" className="text-base font-semibold text-dashboard-text">
        {t("reportTeams.coordinator.leaveRequestsTitle")}
      </h2>
      <p className="mt-1 text-sm text-dashboard-text-muted">
        {t("reportTeams.coordinator.leaveRequestsDescription")}
      </p>
      {feedback ? (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {feedback}
        </p>
      ) : null}
      {pendingLeaveRequests.length === 0 ? (
        <p className="mt-3 text-sm text-dashboard-text-muted">
          {t("reportTeams.coordinator.leaveRequestsEmpty")}
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-dashboard-divider text-xs uppercase text-dashboard-text-muted">
                <th className="px-2 py-2">{t("reportTeams.coordinator.applicants.team")}</th>
                <th className="px-2 py-2">{t("reportTeams.coordinator.applicants.user")}</th>
                <th className="px-2 py-2">{t("reportTeams.coordinator.applicants.message")}</th>
                <th className="px-2 py-2">{t("reportTeams.coordinator.leaveRequestsDate")}</th>
                <th className="px-2 py-2">{t("reportTeams.coordinator.applicants.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {pendingLeaveRequests.map((req) => (
                <tr key={req.id} className="border-b border-dashboard-divider/60">
                  <td className="px-2 py-3 font-medium text-dashboard-text">{req.teamLabel}</td>
                  <td className="px-2 py-3 text-dashboard-text-muted">
                    {req.requesterDisplayName}
                  </td>
                  <td className="max-w-xs px-2 py-3 text-dashboard-text-muted">
                    {req.message?.trim() || "—"}
                  </td>
                  <td className="whitespace-nowrap px-2 py-3 text-dashboard-text-subtle">
                    {dateFormatter.format(new Date(req.requestedAt))}
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/${lng}/coordination/team/${encodeURIComponent(req.teamId)}`}
                        className="dashboard-card-cta text-xs"
                      >
                        {t("reportTeams.coordinator.leaveRequestsOpenTeam")} →
                      </Link>
                      <ActionButton
                        type="button"
                        variant="primary"
                        disabled={isBusy}
                        onClick={() => void onApprove(req)}
                      >
                        {approvingId === req.id
                          ? t("reportTeams.coordinator.approving")
                          : t("reportTeams.coordinator.leaveRequestsMarkHandled")}
                      </ActionButton>
                      <ActionButton
                        type="button"
                        variant="secondary"
                        disabled={isBusy}
                        onClick={() => void onReject(req)}
                      >
                        {rejectingId === req.id
                          ? t("reportTeams.coordinator.rejecting")
                          : t("reportTeams.coordinator.leaveRequestsDismiss")}
                      </ActionButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
