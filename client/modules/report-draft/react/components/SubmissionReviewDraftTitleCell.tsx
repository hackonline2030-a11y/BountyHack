"use client";

import type { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { formatReportTeamMembersDisplay } from "@modules/report-draft/core/view/format-report-team-members";

const ROLE_FR: Record<string, string> = {
  hunter: "Hunter",
  quality_checker: "Quality checker",
  mentor: "Mentor",
  super_admin: "Super admin",
};

type Props = {
  draft: ReportDraftDomainModel.ReportDraft | undefined;
};

/**
 * Table cell: équipe rapport (titre coordinateur) + titre contenu optionnel + roster.
 */
export function SubmissionReviewDraftTitleCell({ draft }: Props) {
  if (!draft) {
    return <span className="text-form-text-muted">Brouillon introuvable</span>;
  }

  const teamLabel = draft.reportTeam?.label?.trim();
  const contentTitle = draft.meta.payload.reportTitle?.trim() ?? "";

  const primary =
    teamLabel ||
    (contentTitle === ""
      ? "Sans titre"
      : contentTitle);

  const membersLine =
    draft.reportTeam?.members?.length &&
    draft.reportTeam.members.length > 0
      ? formatReportTeamMembersDisplay(draft.reportTeam.members, (r) => ROLE_FR[r] ?? r)
      : null;

  return (
    <div className="max-w-xs">
      <p className="font-medium text-form-text">{primary}</p>
      {teamLabel && contentTitle ? (
        <p className="mt-0.5 text-xs text-form-text-muted">
          Contenu : {contentTitle}
        </p>
      ) : null}
      {membersLine ? (
        <p className="mt-1 text-xs leading-snug text-form-text-muted">{membersLine}</p>
      ) : null}
    </div>
  );
}
