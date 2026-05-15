"use client";

import { useState, type FC } from "react";
import { reportTeamsFixture } from "@modules/report-team/fixtures/report-team.fixtures";
import { ReportTeamValidityBadge } from "@modules/report-team/react/ReportTeamValidityBadge";
import type { ReportTeamMemberRole } from "@modules/report-team/model/report-team.types";

type Labels = {
  teamId: string;
  label: string;
  validity: string;
  members: string;
  actions: string;
  edit: string;
  delete: string;
  deleteConfirm: string;
  validityValid: string;
  validityIncomplete: string;
  roleLabels: Record<ReportTeamMemberRole, string>;
  mockAction: string;
};

type Props = { labels: Labels };

export const ReportTeamAdminTable: FC<Props> = ({ labels }) => {
  const [teams, setTeams] = useState([...reportTeamsFixture]);
  const [toast, setToast] = useState<string | null>(null);

  function onDelete(id: string, label: string) {
    if (!window.confirm(labels.deleteConfirm)) return;
    setTeams((list) => list.filter((t) => t.id !== id));
    setToast(`${labels.delete}: ${label} (${labels.mockAction})`);
    window.setTimeout(() => setToast(null), 3000);
  }

  function onEdit(label: string) {
    setToast(`${labels.edit}: ${label} (${labels.mockAction})`);
    window.setTimeout(() => setToast(null), 3000);
  }

  return (
    <div>
      {toast ? (
        <p role="status" className="mb-4 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          {toast}
        </p>
      ) : null}
      <div className="overflow-x-auto rounded-lg border border-dashboard-card-border">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-dashboard-divider bg-dashboard-accent-soft/40">
            <tr>
              <th className="px-4 py-3 font-semibold text-dashboard-text">{labels.teamId}</th>
              <th className="px-4 py-3 font-semibold text-dashboard-text">{labels.label}</th>
              <th className="px-4 py-3 font-semibold text-dashboard-text">{labels.validity}</th>
              <th className="px-4 py-3 font-semibold text-dashboard-text">{labels.members}</th>
              <th className="px-4 py-3 font-semibold text-dashboard-text">{labels.actions}</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => (
              <tr key={team.id} className="border-b border-dashboard-divider last:border-0">
                <td className="px-4 py-3 font-mono text-xs text-dashboard-text-muted">{team.id}</td>
                <td className="px-4 py-3 text-dashboard-text">{team.label}</td>
                <td className="px-4 py-3">
                  <ReportTeamValidityBadge
                    validity={team.validity}
                    validLabel={labels.validityValid}
                    incompleteLabel={labels.validityIncomplete}
                  />
                </td>
                <td className="px-4 py-3 text-dashboard-text-muted">
                  {team.members
                    .map((m) => `${m.displayName} (${labels.roleLabels[m.role]})`)
                    .join(", ")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="text-xs font-medium text-dashboard-accent hover:underline"
                      onClick={() => onEdit(team.label)}
                    >
                      {labels.edit}
                    </button>
                    <button
                      type="button"
                      className="text-xs font-medium text-red-600 hover:underline"
                      onClick={() => onDelete(team.id, team.label)}
                    >
                      {labels.delete}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
