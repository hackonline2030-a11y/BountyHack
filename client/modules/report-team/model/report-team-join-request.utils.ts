import type { ReportTeamJoinRequest } from "@modules/report-team/model/report-team.types";

function hasNonEmptyString(v: string | undefined | null): boolean {
  return typeof v === "string" && v.length > 0;
}

/**
 * Open enrollment (new report team pool only): request is not tied to an existing team
 * or draft. Join-existing flows send at least one of `teamId` or `reportDraftId`.
 */
export function isEnrollmentJoinRequest(
  req: Pick<ReportTeamJoinRequest, "teamId" | "reportDraftId">,
): boolean {
  return (
    !hasNonEmptyString(req.teamId) && !hasNonEmptyString(req.reportDraftId)
  );
}
