"use client";

import { type FC, type ReactNode } from "react";

/** Zone scrollable de l’aperçu (max. hauteur viewport). */
export const ReportPreviewScrollArea: FC<{ children: ReactNode }> = ({ children }) => (
  <div className="max-h-[100vh] w-full overflow-y-auto bg-slate-100 py-4">
    <div className="mx-auto flex w-fit flex-col items-center">{children}</div>
  </div>
);

/** Feuille A4 (largeur / hauteur minimale alignées sur le PDF). */
export const ReportPreviewA4Page: FC<{
  children: ReactNode;
  "aria-label"?: string;
}> = ({ children, "aria-label": ariaLabel = "Page du rapport" }) => (
  <article
    aria-label={ariaLabel}
    className="box-border w-[210mm] min-h-[297mm] shrink-0 bg-white px-[24mm] py-[20mm] text-[14px] leading-[1.45] text-[#1f2430] shadow-lg"
  >
    {children}
  </article>
);

/** Séparateur visuel entre deux pages (changement de page). */
export const ReportPreviewPageBreak: FC = () => (
  <div
    role="separator"
    aria-label="Changement de page"
    className="my-3 box-border w-[210mm] shrink-0 border-t-2 border-dashed border-slate-400"
  />
);
