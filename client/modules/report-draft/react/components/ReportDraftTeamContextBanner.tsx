"use client";

import type { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { formatReportTeamMembersDisplay } from "@modules/report-draft/core/view/format-report-team-members";

/** French role labels aligned with coordinator / team screens. */
const ROLE_FR: Record<string, string> = {
  hunter: "Hunter",
  quality_checker: "Quality checker",
  mentor: "Mentor",
  super_admin: "Super admin",
};

export const ReportDraftTeamContextBanner: React.FC<{
  team: ReportDraftDomainModel.ReportDraftTeamSummary;
  className?: string;
}> = ({ team, className = "" }) => {
  const roster = formatReportTeamMembersDisplay(team.members, (r) => ROLE_FR[r] ?? r);

  return (
    <div
      className={`mb-4 rounded-lg border border-violet-200 bg-violet-50/90 px-3 py-2.5 text-sm shadow-sm ${className}`.trim()}
    >
      <p className="font-semibold text-violet-950">
        Équipe rapport · {team.label.trim() || "—"}
      </p>
      <p className="mt-1 text-xs text-violet-900">{roster}</p>
      <p className="mt-2 text-[11px] leading-snug text-violet-800/90">
        Titre attribué par le coordinateur. Le « Titre du rapport » ci-dessous décrit le contenu
        technique pour le programme.
      </p>
    </div>
  );
};
