"use client";

import { type FC } from "react";
import type { SectionBloc } from "@modules/report-draft/core/model/section-bloc";
import { createEmptySectionBloc } from "@modules/report-draft/core/model/section-bloc";
import type { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { SectionBlocHeadingFields } from "@modules/report-draft/react/components/section-bloc/SectionBlocHeadingFields";
import { SectionBlocListsEditor } from "@modules/report-draft/react/components/section-bloc/SectionBlocListsEditor";

const fieldLabel =
  "text-xs font-medium uppercase tracking-wide text-form-text-muted";
const fieldTextarea =
  "min-h-[120px] w-full rounded-md border border-form-border bg-form-surface p-3 text-sm text-form-text placeholder:text-form-placeholder focus:border-form-border-strong focus:outline-none focus:ring-2 focus:ring-form-accent/40 disabled:cursor-not-allowed disabled:opacity-60";

type Props = {
  blocs: ReadonlyArray<SectionBloc>;
  editable: boolean;
  attachments?: ReadonlyArray<ReportDraftDomainModel.Attachment>;
  imageUploadByBlocId?: Record<string, { status: "uploading" | "error"; message?: string }>;
  onImageUpload?: (blocId: string, file: File) => Promise<void>;
  onChange: (blocs: SectionBloc[]) => void;
};

export const SectionBlocRepeater: FC<Props> = ({
  blocs,
  editable,
  attachments = [],
  imageUploadByBlocId = {},
  onImageUpload,
  onChange,
}) => {
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
          Ajoutez une ou plusieurs sections (titre, sous-titre, texte, listes, image). L’ordre
          sera respecté dans le rapport PDF.
        </p>
      </div>

      {blocs.length === 0 ? (
        <p className="rounded-md border border-dashed border-form-border bg-form-overlay p-4 text-sm text-form-text-muted">
          Aucune section pour l’instant. Utilisez « Ajouter une section » pour commencer.
        </p>
      ) : null}

      <ul className="flex flex-col gap-4">
        {blocs.map((bloc, index) => (
          <li key={bloc.id} className="rounded-lg border border-form-border bg-form-overlay p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-form-text">
                Section {index + 1}
              </span>
              {editable ? (
                <button
                  type="button"
                  className="cursor-pointer rounded-md border border-form-border bg-form-surface px-2.5 py-1 text-xs font-medium text-form-text hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => removeBloc(bloc.id)}
                  aria-label={`Supprimer la section ${index + 1}`}
                >
                  − Supprimer
                </button>
              ) : null}
            </div>

            <div className="flex flex-col gap-4">
              <SectionBlocHeadingFields
                label="Titre (H2 dans le PDF)"
                placeholder="Ex. Collecte et reconnaissance"
                text={bloc.heading}
                format={bloc.headingFormat}
                editable={editable}
                onTextChange={(heading) => updateBloc(bloc.id, { heading })}
                onFormatChange={(patch) =>
                  updateBloc(bloc.id, {
                    headingFormat: { ...bloc.headingFormat, ...patch },
                  })
                }
              />
              <SectionBlocHeadingFields
                label="Sous-titre (H3 dans le PDF)"
                placeholder="Ex. API d’administration"
                text={bloc.subheading}
                format={bloc.subheadingFormat}
                editable={editable}
                onTextChange={(subheading) => updateBloc(bloc.id, { subheading })}
                onFormatChange={(patch) =>
                  updateBloc(bloc.id, {
                    subheadingFormat: { ...bloc.subheadingFormat, ...patch },
                  })
                }
              />
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
              <SectionBlocListsEditor
                lists={bloc.lists}
                editable={editable}
                onChange={(lists) => updateBloc(bloc.id, { lists })}
              />
              {onImageUpload ? (
                <SectionBlocImageUpload
                  bloc={bloc}
                  editable={editable}
                  attachment={attachments.find((a) => a.id === bloc.attachmentId)}
                  uploadState={imageUploadByBlocId[bloc.id]}
                  onUpload={onImageUpload}
                />
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      {editable ? (
        <button
          type="button"
          className="inline-flex w-fit cursor-pointer items-center gap-1 rounded-md border border-form-border bg-form-surface px-3 py-2 text-sm font-medium text-form-text hover:bg-white"
          onClick={addBloc}
        >
          + Ajouter une section
        </button>
      ) : null}
    </div>
  );
};

const SectionBlocImageUpload: FC<{
  bloc: SectionBloc;
  editable: boolean;
  attachment?: ReportDraftDomainModel.Attachment;
  uploadState?: { status: "uploading" | "error"; message?: string };
  onUpload: (blocId: string, file: File) => Promise<void>;
}> = ({ bloc, editable, attachment, uploadState, onUpload }) => (
  <div className="flex flex-col gap-2 border-t border-form-border pt-3">
    <div className="flex flex-col gap-0.5">
      <p className="text-sm font-medium text-form-text">Image de la section</p>
      <p className="text-xs text-form-text-muted">
        PNG, JPG ou WEBP. L’image sera affichée dans l’aperçu et le PDF après cette section.
      </p>
    </div>
    {attachment ? (
      <p className="text-xs text-form-text-muted">
        Image actuelle : <span className="font-medium text-form-text">{attachment.filename}</span>
      </p>
    ) : null}
    {editable ? (
      <label className="flex max-w-md flex-col gap-1">
        <span className={fieldLabel}>Téléverser une image</span>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="w-full rounded-md border border-form-border bg-form-surface px-3 py-2 text-sm text-form-text file:mr-3 file:cursor-pointer file:rounded file:border-0 file:bg-form-accent file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={uploadState?.status === "uploading"}
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = "";
            if (!file) return;
            void onUpload(bloc.id, file);
          }}
        />
      </label>
    ) : null}
    {uploadState?.status === "uploading" ? (
      <p className="text-xs text-form-text-muted">Envoi de l’image…</p>
    ) : null}
    {uploadState?.status === "error" ? (
      <p role="alert" className="text-xs text-rose-700">
        {uploadState.message ?? "Impossible d’envoyer l’image."}
      </p>
    ) : null}
  </div>
);
