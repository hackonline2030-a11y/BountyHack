import type { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";

/** Table row background from aggregate workflow status. */
export function reportDraftAggregateStatusRowClass(
  status: ReportDraftDomainModel.AggregateStatus,
): string {
  switch (status) {
    case "draft":
      return "bg-slate-100/90 hover:bg-slate-200/90";
    case "under-review":
      return "bg-amber-50/95 hover:bg-amber-100/95";
    case "under-global-review":
      return "bg-violet-50/95 hover:bg-violet-100/95";
    case "ready-to-program":
      return "bg-emerald-50/95 hover:bg-emerald-100/95";
    case "submitted-to-program":
    case "published":
      return "bg-sky-50/95 hover:bg-sky-100/95";
    case "rejected":
      return "bg-rose-50/95 hover:bg-rose-100/95";
    case "given-up":
      return "bg-zinc-100/90 hover:bg-zinc-200/90";
  }
}

/** Status pill on table rows (stronger contrast than row wash). */
export function reportDraftAggregateStatusBadgeClass(
  status: ReportDraftDomainModel.AggregateStatus,
): string {
  switch (status) {
    case "draft":
      return "bg-slate-200 text-slate-900";
    case "under-review":
      return "bg-amber-200 text-amber-950";
    case "under-global-review":
      return "bg-violet-200 text-violet-950";
    case "ready-to-program":
      return "bg-emerald-200 text-emerald-950";
    case "submitted-to-program":
    case "published":
      return "bg-sky-200 text-sky-950";
    case "rejected":
      return "bg-rose-200 text-rose-950";
    case "given-up":
      return "bg-zinc-300 text-zinc-800";
  }
}
