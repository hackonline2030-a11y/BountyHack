"use client";

import { type FC } from "react";
import type { SectionBloc } from "@modules/report-draft/core/model/section-bloc";
import {
  sectionHeadingFormatClassName,
  sectionHeadingFormatStyle,
} from "@modules/report-draft/core/model/section-bloc-format";

type Props = {
  bloc: SectionBloc;
  index: number;
  /** Aperçu rapport PDF : pas de libellé « Section N » si le titre est vide. */
  documentMode?: boolean;
};

export const SectionBlocDisplay: FC<Props> = ({ bloc, index, documentMode = false }) => {
  const hasBody = bloc.body.trim().length > 0;
  const hasLists = bloc.lists.some(
    (l) => l.title.trim() || l.items.some((i) => i.trim().length > 0),
  );

  const sectionClass = documentMode
    ? "mb-4 last:mb-0"
    : "border-b border-form-border pb-4 last:border-0";
  const textClass = documentMode ? "text-[#1f2430]" : "text-form-text";
  const mutedClass = documentMode ? "text-slate-500" : "text-form-text-muted";

  return (
    <section className={sectionClass}>
      {bloc.heading.trim() ? (
        <h3
          className={`leading-snug ${textClass} ${sectionHeadingFormatClassName(bloc.headingFormat)}`}
          style={sectionHeadingFormatStyle(bloc.headingFormat)}
        >
          {bloc.heading}
        </h3>
      ) : documentMode ? null : (
        <p className={`text-xs ${mutedClass}`}>Section {index + 1}</p>
      )}
      {bloc.subheading.trim() ? (
        <h4
          className={`mt-1 leading-snug ${textClass} ${sectionHeadingFormatClassName(bloc.subheadingFormat)}`}
          style={sectionHeadingFormatStyle(bloc.subheadingFormat)}
        >
          {bloc.subheading}
        </h4>
      ) : null}
      {hasBody ? (
        <p className={`mt-2 whitespace-pre-wrap text-sm ${textClass}`}>{bloc.body}</p>
      ) : !hasLists && !documentMode ? (
        <p className={`mt-2 text-sm ${mutedClass}`}>—</p>
      ) : null}
      {bloc.lists.map((list) => {
        const items = list.items.filter((i) => i.trim().length > 0);
        if (!list.title.trim() && items.length === 0) return null;
        const ListTag = list.ordered ? "ol" : "ul";
        return (
          <div key={list.id} className="mt-3">
            {list.title.trim() ? (
              <p
                className={`mb-1 text-sm ${textClass} ${list.titleBold ? "font-bold" : "font-normal"}`}
              >
                {list.title}
              </p>
            ) : null}
            {items.length > 0 ? (
              <ListTag
                className={`ml-5 text-sm ${textClass} ${list.ordered ? "list-decimal" : "list-disc"}`}
              >
                {items.map((item, i) => (
                  <li key={`${list.id}-${i}`} className="mt-0.5">
                    {item}
                  </li>
                ))}
              </ListTag>
            ) : null}
          </div>
        );
      })}
    </section>
  );
};
