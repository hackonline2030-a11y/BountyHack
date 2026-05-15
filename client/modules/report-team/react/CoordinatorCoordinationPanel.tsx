"use client";

import { useState, type FC } from "react";
import {
  coordinatorPendingRequestsFixture,
  reportTeamsFixture,
} from "@modules/report-team/fixtures/report-team.fixtures";
import { ReportTeamValidityBadge } from "@modules/report-team/react/ReportTeamValidityBadge";
import type { ReportTeamMemberRole } from "@modules/report-team/model/report-team.types";

type Labels = {
  pendingTitle: string;
  pendingEmpty: string;
  approve: string;
  reject: string;
  teamsTitle: string;
  createTeam: string;
  addMember: string;
  validityValid: string;
  validityIncomplete: string;
  roleLabels: Record<ReportTeamMemberRole, string>;
  teamIdLabel: string;
  membersLabel: string;
  mockAction: string;
};

type Props = { labels: Labels };

export const CoordinatorCoordinationPanel: FC<Props> = ({ labels }) => {
  const [pending, setPending] = useState([...coordinatorPendingRequestsFixture]);
  const [toast, setToast] = useState<string | null>(null);

  function act(id: string, action: "approve" | "reject") {
    setPending((list) => list.filter((r) => r.id !== id));
    setToast(
      action === "approve"
        ? `${labels.approve} — ${labels.mockAction}`
        : `${labels.reject} — ${labels.mockAction}`,
    );
    window.setTimeout(() => setToast(null), 3000);
  }

  return (
    <div className="flex flex-col gap-6">
      {toast ? (
        <p role="status" className="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          {toast}
        </p>
      ) : null}
      <section className="dashboard-card p-4 sm:p-5" aria-labelledby="coord-pending">
        <h2 id="coord-pending" className="text-base font-semibold text-dashboard-text">
          {labels.pendingTitle}
        </h2>
        {pending.length === 0 ? (
          <p className="mt-3 text-sm text-dashboard-text-muted">{labels.pendingEmpty}</p>
        ) : (
          <ul role="list" className="mt-4 flex flex-col gap-3">
            {pending.map((req) => (
              <li
                key={req.id}
                className="flex flex-col gap-3 rounded-lg border border-dashboard-card-border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-dashboard-text">{req.teamLabel}</p>
                  <p className="font-mono text-xs text-dashboard-text-muted">{req.teamId}</p>
                  <p className="mt-1 text-xs text-dashboard-text-muted">
                    {labels.roleLabels[req.requestedRole]}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    className="btn-common-styles btn-primary text-sm"
                    onClick={() => act(req.id, "approve")}
                  >
                    {labels.approve}
                  </button>
                  <button
                    type="button"
                    className="btn-common-styles border border-dashboard-card-border bg-white/90 text-sm text-dashboard-text"
                    onClick={() => act(req.id, "reject")}
                  >
                    {labels.reject}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="dashboard-card p-4 sm:p-5" aria-labelledby="coord-teams">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="coord-teams" className="text-base font-semibold text-dashboard-text">
            {labels.teamsTitle}
          </h2>
          <div className="flex gap-2">
            <button type="button" className="btn-common-styles btn-primary text-sm" disabled>
              {labels.createTeam}
            </button>
            <button
              type="button"
              className="btn-common-styles border border-dashboard-card-border bg-white/90 text-sm text-dashboard-text"
              disabled
            >
              {labels.addMember}
            </button>
          </div>
        </div>
        <ul role="list" className="mt-4 flex flex-col gap-3">
          {reportTeamsFixture.map((team) => (
            <li
              key={team.id}
              className="rounded-lg border border-dashboard-card-border p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-dashboard-text">{team.label}</p>
                  <p className="font-mono text-xs text-dashboard-text-muted">
                    {labels.teamIdLabel}: {team.id}
                  </p>
                </div>
                <ReportTeamValidityBadge
                  validity={team.validity}
                  validLabel={labels.validityValid}
                  incompleteLabel={labels.validityIncomplete}
                />
              </div>
              <p className="mt-2 text-xs text-dashboard-text-muted">{labels.membersLabel}</p>
              <p className="mt-1 text-sm text-dashboard-text">
                {team.members
                  .map((m) => `${m.displayName} (${labels.roleLabels[m.role]})`)
                  .join(" · ")}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};
