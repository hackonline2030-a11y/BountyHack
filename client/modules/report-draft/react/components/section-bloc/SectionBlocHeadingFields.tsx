"use client";

import { type FC } from "react";
import type { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { DEFAULT_SECTION_HEADING_FORMAT } from "@modules/report-draft/core/model/section-bloc-format";

const fieldLabel =
  "text-xs font-medium uppercase tracking-wide text-form-text-muted";
const fieldInput =
  "w-full rounded-md border border-form-border bg-form-surface px-3 py-2 text-sm text-form-text placeholder:text-form-placeholder focus:border-form-border-strong focus:outline-none focus:ring-2 focus:ring-form-accent/40 disabled:cursor-not-allowed disabled:opacity-60";
const fieldSelect =
  "rounded-md border border-form-border bg-form-surface px-2 py-1.5 text-sm text-form-text focus:border-form-border-strong focus:outline-none focus:ring-2 focus:ring-form-accent/40 disabled:cursor-not-allowed disabled:opacity-60";

type Props = {
  label: string;
  placeholder: string;
  text: string;
  format: ReportDraftDomainModel.SectionHeadingFormat;
  editable: boolean;
  onTextChange: (value: string) => void;
  onFormatChange: (patch: Partial<ReportDraftDomainModel.SectionHeadingFormat>) => void;
};

export const SectionBlocHeadingFields: FC<Props> = ({
  label,
  placeholder,
  text,
  format,
  editable,
  onTextChange,
  onFormatChange,
}) => {
  const f = format ?? DEFAULT_SECTION_HEADING_FORMAT;

  return (
    <div className="flex flex-col gap-2">
      <label className="flex flex-col gap-1">
        <span className={fieldLabel}>{label}</span>
        <input
          type="text"
          className={fieldInput}
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          disabled={!editable}
          placeholder={placeholder}
        />
      </label>
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-0.5">
          <span className="text-[11px] text-form-text-muted">Style</span>
          <select
            className={fieldSelect}
            value={f.style}
            disabled={!editable}
            onChange={(e) =>
              onFormatChange({
                style: e.target.value as ReportDraftDomainModel.SectionHeadingStyle,
              })
            }
          >
            <option value="normal">Normal</option>
            <option value="italic">Italique</option>
            <option value="bold">Gras</option>
          </select>
        </label>
        <label className="flex flex-col gap-0.5">
          <span className="text-[11px] text-form-text-muted">Taille</span>
          <select
            className={fieldSelect}
            value={f.fontSize}
            disabled={!editable}
            onChange={(e) =>
              onFormatChange({
                fontSize: e.target.value as ReportDraftDomainModel.SectionFontSize,
              })
            }
          >
            <option value="small">Petit</option>
            <option value="medium">Moyen</option>
            <option value="large">Grand</option>
            <option value="huge">Très grand</option>
          </select>
        </label>
        <label className="flex flex-col gap-0.5">
          <span className="text-[11px] text-form-text-muted">Couleur</span>
          <input
            type="color"
            className="h-9 w-12 cursor-pointer rounded border border-form-border bg-form-surface p-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            value={
              /^#[0-9A-Fa-f]{6}$/.test(f.color) ? f.color : DEFAULT_SECTION_HEADING_FORMAT.color
            }
            disabled={!editable}
            onChange={(e) => onFormatChange({ color: e.target.value })}
            aria-label={`Couleur — ${label}`}
          />
        </label>
      </div>
    </div>
  );
};
