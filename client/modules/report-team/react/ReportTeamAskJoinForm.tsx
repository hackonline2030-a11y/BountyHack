"use client";

import { ActionButton } from "@modules/app/nextjs/components/buttons/ActionButton";

import { useState, type FC } from "react";
import type {
  ReportTeam,
  ReportTeamMemberRole,
} from "@modules/report-team/model/report-team.types";
import { requestJoinTeam } from "@modules/report-team/core/useCase/request-join-team.usecase";
import { useAppDispatch } from "@store/redux/store";

type Labels = {
  teamLabel: string;
  teamPlaceholder: string;
  roleLabel: string;
  messageLabel: string;
  messagePlaceholder: string;
  submit: string;
  submitting: string;
  success: string;
  errorTeamRequired: string;
  noTeamsAvailable: string;
  roles: Record<ReportTeamMemberRole, string>;
};

type Props = {
  joinableTeams: ReadonlyArray<ReportTeam>;
  defaultRole: ReportTeamMemberRole;
  roleOptions: ReadonlyArray<ReportTeamMemberRole>;
  labels: Labels;
};

const fieldLabel =
  "text-xs font-medium uppercase tracking-wide text-dashboard-text-muted";
const fieldInput =
  "w-full rounded-lg border border-dashboard-card-border bg-white px-3 py-2 text-sm text-dashboard-text shadow-sm focus:border-dashboard-accent focus:outline-none focus:ring-1 focus:ring-dashboard-accent";

export const ReportTeamAskJoinForm: FC<Props> = ({
  joinableTeams,
  defaultRole,
  roleOptions,
  labels,
}) => {
  const dispatch = useAppDispatch();
  const [reportDraftId, setReportDraftId] = useState(
    () => joinableTeams[0]?.reportDraftId ?? "",
  );
  const [role, setRole] = useState<ReportTeamMemberRole>(defaultRole);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState("");

  if (joinableTeams.length === 0) {
    return (
      <p className="text-sm text-dashboard-text-muted">{labels.noTeamsAvailable}</p>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reportDraftId) {
      setStatus("error");
      setFeedback(labels.errorTeamRequired);
      return;
    }
    setStatus("loading");
    setFeedback("");
    try {
      await dispatch(
        requestJoinTeam({
          reportDraftId,
          requestedRole: role,
          message: message.trim() || undefined,
        }),
      );
      setStatus("success");
      setFeedback(labels.success);
      setMessage("");
    } catch (error) {
      setStatus("error");
      setFeedback(error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1">
        <label htmlFor="rt-team" className={fieldLabel}>
          {labels.teamLabel}
        </label>
        <select
          id="rt-team"
          value={reportDraftId}
          onChange={(e) => setReportDraftId(e.target.value)}
          className={fieldInput}
          disabled={status === "loading"}
        >
          <option value="">{labels.teamPlaceholder}</option>
          {joinableTeams.map((team) => (
            <option key={team.reportDraftId} value={team.reportDraftId}>
              {team.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="rt-role" className={fieldLabel}>
          {labels.roleLabel}
        </label>
        <select
          id="rt-role"
          value={role}
          onChange={(e) => setRole(e.target.value as ReportTeamMemberRole)}
          className={fieldInput}
          disabled={status === "loading"}
        >
          {roleOptions.map((r) => (
            <option key={r} value={r}>
              {labels.roles[r]}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="rt-message" className={fieldLabel}>
          {labels.messageLabel}
        </label>
        <textarea
          id="rt-message"
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={labels.messagePlaceholder}
          className={`${fieldInput} resize-y`}
          disabled={status === "loading"}
        />
      </div>
      {feedback ? (
        <p
          role="alert"
          className={`text-sm ${status === "error" ? "text-red-600" : "text-emerald-700"}`}
        >
          {feedback}
        </p>
      ) : null}
      <ActionButton
        type="submit"
        variant="primary"
        disabled={status === "loading" || !reportDraftId}
        className="w-fit"
      >
        {status === "loading" ? labels.submitting : labels.submit}
      </ActionButton>
    </form>
  );
};
