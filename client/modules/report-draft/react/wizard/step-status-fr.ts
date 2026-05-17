import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";

/** Libellés UI (FR) pour l’état machine d’une étape du rapport. */
export function stepStatusLabelFr(
  status: ReportDraftDomainModel.StepStatus,
): string {
  switch (status) {
    case "in-progress":
      return "Brouillon";
    case "awaiting-review":
      return "En attente de revue";
    case "needs-revision":
      return "Révisions demandées";
    case "approved":
      return "Validée";
    case "in-global-progress":
      return "Révision globale — en cours";
    case "awaiting-global-review":
      return "Révision globale — en attente QC";
    case "needs-global-revision":
      return "Révision globale — à corriger";
  }
}

export function stepStatusPillClassFr(
  status: ReportDraftDomainModel.StepStatus,
): string {
  const base =
    "inline-flex max-w-full items-center rounded-full border px-3 py-1 text-xs font-semibold";
  switch (status) {
    case "approved":
      return `${base} border-emerald-300 bg-emerald-50 text-emerald-950`;
    case "awaiting-review":
    case "awaiting-global-review":
      return `${base} border-amber-300 bg-amber-50 text-amber-950`;
    case "needs-revision":
    case "needs-global-revision":
      return `${base} border-rose-300 bg-rose-50 text-rose-950`;
    case "in-progress":
      return `${base} border-slate-200 bg-slate-50 text-slate-800`;
    case "in-global-progress":
      return `${base} border-violet-300 bg-violet-50 text-violet-950`;
  }
}
