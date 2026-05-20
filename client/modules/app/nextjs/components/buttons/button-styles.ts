/** Shared Tailwind class strings for buttons and button-like controls. */

export const primaryButtonClass =
  "btn-common-styles btn-primary inline-flex w-fit items-center";

/** Login submit — near-black on dark auth panels (exception to violet `.btn-primary`). */
export const primaryDarkButtonClass =
  "btn-common-styles btn-primary-dark inline-flex w-fit items-center";

export const iconActionClass =
  "inline-flex size-8 cursor-pointer items-center justify-center rounded-md border border-dashboard-divider bg-white text-dashboard-text transition hover:bg-dashboard-accent-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-dashboard-accent focus-visible:ring-offset-1";

export const iconActionDangerClass =
  "inline-flex size-8 cursor-pointer items-center justify-center rounded-md border border-rose-200 bg-white text-rose-700 transition hover:bg-rose-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50";

export const iconActionDraftDangerClass =
  "inline-flex size-8 cursor-pointer items-center justify-center rounded-md border border-violet-300 bg-white text-violet-800 transition hover:bg-violet-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50";

export const formPanelAccentClass =
  "cursor-pointer rounded-md bg-form-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-form-accent";

export const formPanelSurfaceClass =
  "cursor-pointer rounded-md border border-form-border bg-form-surface px-4 py-2 text-sm font-semibold text-form-text transition hover:bg-form-overlay disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-form-accent";

export const formPanelEmeraldClass =
  "cursor-pointer rounded-md border border-emerald-700 bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600";

export const submissionApproveClass =
  "cursor-pointer rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50";

export const submissionRevisionClass =
  "cursor-pointer rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50";

export const submissionRejectClass =
  "cursor-pointer rounded-md border border-rose-400 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-900 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50";

export const wizardBackClass =
  "cursor-pointer rounded-md border border-form-border bg-form-surface px-4 py-2 text-form-text-muted hover:bg-form-overlay disabled:cursor-not-allowed disabled:opacity-50";

export const wizardNextClass =
  "cursor-pointer rounded-md border border-form-border bg-form-surface px-4 py-2 font-medium text-form-text hover:bg-form-overlay disabled:cursor-not-allowed disabled:opacity-50";

export const wizardSubmitClass =
  "cursor-pointer rounded-md bg-form-accent px-4 py-2 font-medium text-white hover:bg-form-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-form-accent-strong focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-form-accent-disabled";

export const tabButtonBaseClass =
  "cursor-pointer -mb-px border-b-2 px-1 py-3 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-form-accent";

export const tabButtonActiveClass = "border-form-accent text-form-text";

export const tabButtonInactiveClass =
  "border-transparent text-form-text-muted hover:text-form-text";

export const dashboardCompactAccentClass =
  "btn-common-styles cursor-pointer rounded-md bg-dashboard-accent px-3 py-1 text-xs text-white disabled:cursor-not-allowed disabled:opacity-50";

export const dashboardCompactNeutralClass =
  "btn-common-styles cursor-pointer rounded-md border border-dashboard-card-border bg-white/90 px-3 py-1 text-xs text-dashboard-text disabled:cursor-not-allowed disabled:opacity-50";

export const inlineTextButtonClass = "cursor-pointer underline hover:text-violet-700";

export const globalRevisionSubmitClass =
  "cursor-pointer rounded-md border border-violet-700 bg-violet-50 px-4 py-2 font-medium text-violet-900 hover:bg-violet-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
