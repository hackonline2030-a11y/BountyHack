import type { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";

const ROLE_SORT: Record<string, number> = {
  hunter: 0,
  mentor: 1,
  quality_checker: 2,
  super_admin: 9,
};

/**
 * Readable line — "Name (Role) · …" for report team banners and lists.
 */
export function formatReportTeamMembersDisplay(
  members: ReportDraftDomainModel.ReportDraftTeamSummary["members"],
  roleLabel: (workflowRole: string) => string,
): string {
  return [...members]
    .sort((a, b) => (ROLE_SORT[a.role] ?? 99) - (ROLE_SORT[b.role] ?? 99))
    .map((m) => `${m.displayName} (${roleLabel(m.role)})`)
    .join(" · ");
}
