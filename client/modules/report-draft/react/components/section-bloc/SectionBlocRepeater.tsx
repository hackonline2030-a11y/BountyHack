"use client";

import { type FC } from "react";
import type { SectionBloc } from "@modules/report-draft/core/model/section-bloc";
import { createEmptySectionBloc } from "@modules/report-draft/core/model/section-bloc";

const fieldLabel =
  "text-xs font-medium uppercase tracking-wide text-form-text-muted";
const fieldInput =
  "w-full rounded-md border border-form-border bg-form-surface px-3 py-2 text-sm text-form-text placeholder:text-form-placeholder focus:border-form-border-strong focus:outline-none focus:ring-2 focus:ring-form-accent/40 disabled:cursor-not-allowed disabled:opacity-60";
const fieldTextarea =
  "min-h-[120px] w-full rounded-md border border-form-border bg-form-surface p-3 text-sm text-form-text placeholder:text-form-placeholder focus:border-form-border-strong focus:outline-none focus:ring-2 focus:ring-form-accent/40 disabled:cursor-not-allowed disabled:opacity-60";

type Props = {
  blocs: ReadonlyArray<SectionBloc>;
  editable: boolean;
  onChange: (blocs: SectionBloc[]) => void;
};

export const SectionBlocRepeater: FC<Props> = ({ blocs, editable, onChange }) => {
  function updateBloc(id: string, patch: Partial<SectionBloc>) {
    onChange(
      blocs.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    );
  }

  function addBloc() {
    onChange([...blocs, createEmptySectionBloc()]);
  }

  function removeBloc(id: string) {
    onChange(blocs.filter((b) => b.id !== id));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-form-text">Sections libres</p>
        <p className="text-sm text-form-text-muted">
          Ajoutez une ou plusieurs sections (titre, sous-titre, texte). L’ordre sera respecté
          dans le rapport PDF. Les images par section arrivent dans une prochaine version.
        </p>
      </div>

      {blocs.length === 0 ? (
        <p className="rounded-md border border-dashed border-form-border bg-form-overlay p-4 text-sm text-form-text-muted">
          Aucune section pour l’instant. Utilisez « Ajouter une section » pour commencer.
        </p>
      ) : null}

      <ul className="flex flex-col gap-4">
        {blocs.map((bloc, index) => (
          <li
            key={bloc.id}
            className="rounded-lg border border-form-border bg-form-overlay p-4"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-form-text">
                Section {index + 1}
              </span>
              {editable ? (
                <button
                  type="button"
                  className="rounded-md border border-form-border bg-form-surface px-2.5 py-1 text-xs font-medium text-form-text hover:bg-white disabled:opacity-50"
                  onClick={() => removeBloc(bloc.id)}
                  aria-label={`Supprimer la section ${index + 1}`}
                >
                  − Supprimer
                </button>
              ) : null}
            </div>

            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span className={fieldLabel}>Titre (H2 dans le PDF)</span>
                <input
                  type="text"
                  className={fieldInput}
                  value={bloc.heading}
                  onChange={(e) => updateBloc(bloc.id, { heading: e.target.value })}
                  disabled={!editable}
                  placeholder="Ex. Collecte et reconnaissance"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className={fieldLabel}>Sous-titre (H3 dans le PDF)</span>
                <input
                  type="text"
                  className={fieldInput}
                  value={bloc.subheading}
                  onChange={(e) => updateBloc(bloc.id, { subheading: e.target.value })}
                  disabled={!editable}
                  placeholder="Ex. API d’administration"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className={fieldLabel}>Contenu</span>
                <textarea
                  className={fieldTextarea}
                  value={bloc.body}
                  onChange={(e) => updateBloc(bloc.id, { body: e.target.value })}
                  disabled={!editable}
                  placeholder="Paragraphe(s)…"
                />
              </label>
            </div>
          </li>
        ))}
      </ul>

      {editable ? (
        <button
          type="button"
          className="inline-flex w-fit items-center gap-1 rounded-md border border-form-border bg-form-surface px-3 py-2 text-sm font-medium text-form-text hover:bg-white"
          onClick={addBloc}
        >
          + Ajouter une section
        </button>
      ) : null}
    </div>
  );
};
