"use client";

import { type FC } from "react";
import type { PdfTocEntry } from "@modules/report-draft/core/view/report-draft-pdf-chapters";

type Props = {
  title: string;
  author: string;
  toc: readonly PdfTocEntry[];
};

/**
 * Page de garde A4 : titre centré, « par {hunter} », table des matières (comme le PDF final).
 */
export const ReportDraftPdfCoverPage: FC<Props> = ({ title, author, toc }) => (
  <div className="report-preview-cover-inner flex flex-col">
    <div className="text-center">
      <h1 className="m-0 text-[2.75rem] font-bold leading-snug text-slate-900">
        {title}
      </h1>
      <p className="mt-7 text-[2.125rem] text-slate-900">par {author}</p>
    </div>

    {toc.length > 0 ? (
      <ol className="mt-20 w-full list-none space-y-1.5 p-0 text-sm text-slate-900">
        {toc.map((entry) => (
          <li key={`${entry.page}-${entry.label}`} className="flex min-w-0 items-baseline gap-1">
            <span className={entry.bold ? "min-w-0 wrap-break-word font-bold" : "min-w-0 wrap-break-word"}>
              {entry.label}
            </span>
            <span
              className="mx-1 min-h-[1em] min-w-6 flex-1 border-b-2 border-dotted border-slate-600"
              aria-hidden
            />
            <span className="shrink-0 tabular-nums">{entry.page}</span>
          </li>
        ))}
      </ol>
    ) : null}
  </div>
);
