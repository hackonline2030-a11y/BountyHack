"use client";

import { useState, type FC } from "react";
import type { ReportTeamMemberRole } from "@modules/report-team/model/report-team.types";

type Labels = {
  teamIdLabel: string;
  teamIdPlaceholder: string;
  roleLabel: string;
  messageLabel: string;
  messagePlaceholder: string;
  submit: string;
  submitting: string;
  success: string;
  errorTeamId: string;
  roles: Record<ReportTeamMemberRole, string>;
};

type Props = {
  defaultRole: ReportTeamMemberRole;
  roleOptions: ReadonlyArray<ReportTeamMemberRole>;
  labels: Labels;
};

const fieldLabel =
  "text-xs font-medium uppercase tracking-wide text-dashboard-text-muted";
const fieldInput =
  "w-full rounded-lg border border-dashboard-card-border bg-white px-3 py-2 text-sm text-dashboard-text shadow-sm focus:border-dashboard-accent focus:outline-none focus:ring-1 focus:ring-dashboard-accent";

export const ReportTeamAskJoinForm: FC<Props> = ({
  defaultRole,
  roleOptions,
  labels,
}) => {
  const [teamId, setTeamId] = useState("");
  const [role, setRole] = useState<ReportTeamMemberRole>(defaultRole);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!teamId.trim()) {
      setStatus("error");
      setFeedback(labels.errorTeamId);
      return;
    }
    setStatus("loading");
    setFeedback("");
    await new Promise((r) => setTimeout(r, 400));
    setStatus("success");
    setFeedback(labels.success);
    setTeamId("");
    setMessage("");
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1">
        <label htmlFor="rt-team-id" className={fieldLabel}>
          {labels.teamIdLabel}
        </label>
        <input
          id="rt-team-id"
          type="text"
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
          placeholder={labels.teamIdPlaceholder}
          className={`${fieldInput} font-mono text-xs`}
          disabled={status === "loading"}
        />
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
      <button
        type="submit"
        disabled={status === "loading"}
        className="btn-common-styles btn-primary w-fit disabled:opacity-50"
      >
        {status === "loading" ? labels.submitting : labels.submit}
      </button>
    </form>
  );
};