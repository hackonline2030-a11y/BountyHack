"use client";

import { type FC } from "react";
import type { SectionBlocList } from "@modules/report-draft/core/model/section-bloc";
import { createEmptySectionBlocList } from "@modules/report-draft/core/model/section-bloc";

const fieldLabel =
  "text-xs font-medium uppercase tracking-wide text-form-text-muted";
const fieldInput =
  "w-full rounded-md border border-form-border bg-form-surface px-3 py-2 text-sm text-form-text placeholder:text-form-placeholder focus:border-form-border-strong focus:outline-none focus:ring-2 focus:ring-form-accent/40 disabled:cursor-not-allowed disabled:opacity-60";
const fieldSelect =
  "rounded-md border border-form-border bg-form-surface px-2 py-1.5 text-sm text-form-text focus:border-form-border-strong focus:outline-none focus:ring-2 focus:ring-form-accent/40 disabled:cursor-not-allowed disabled:opacity-60";

type Props = {
  lists: ReadonlyArray<SectionBlocList>;
  editable: boolean;
  onChange: (lists: SectionBlocList[]) => void;
};

export const SectionBlocListsEditor: FC<Props> = ({ lists, editable, onChange }) => {
  function updateList(id: string, patch: Partial<SectionBlocList>) {
    onChange(lists.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  function updateListItem(listId: string, index: number, value: string) {
    onChange(
      lists.map((l) => {
        if (l.id !== listId) return l;
        const items = [...l.items];
        items[index] = value;
        return { ...l, items };
      }),
    );
  }

  function addListItem(listId: string) {
    onChange(
      lists.map((l) => (l.id === listId ? { ...l, items: [...l.items, ""] } : l)),
    );
  }

  function removeListItem(listId: string, index: number) {
    onChange(
      lists.map((l) => {
        if (l.id !== listId) return l;
        const items = l.items.filter((_, i) => i !== index);
        return { ...l, items: items.length > 0 ? items : [""] };
      }),
    );
  }

  function addList() {
    onChange([...lists, createEmptySectionBlocList()]);
  }

  function removeList(id: string) {
    onChange(lists.filter((l) => l.id !== id));
  }

  return (
    <div className="flex flex-col gap-3 border-t border-form-border pt-3">
      <div className="flex flex-col gap-0.5">
        <p className="text-sm font-medium text-form-text">Listes (optionnel)</p>
        <p className="text-xs text-form-text-muted">
          Sous le paragraphe : liste numérotée ou à puces, avec titre optionnel.
        </p>
      </div>

      {lists.length === 0 ? (
        <p className="text-xs text-form-text-muted">Aucune liste.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {lists.map((list, listIndex) => (
            <li
              key={list.id}
              className="rounded-md border border-dashed border-form-border bg-form-surface/80 p-3"
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-form-text">
                  Liste {listIndex + 1}
                </span>
                {editable ? (
                  <button
                    type="button"
                    className="text-xs font-medium text-form-text-muted hover:text-form-text"
                    onClick={() => removeList(list.id)}
                  >
                    Supprimer la liste
                  </button>
                ) : null}
              </div>

              <div className="flex flex-col gap-2">
                <label className="flex flex-col gap-0.5">
                  <span className={fieldLabel}>Type</span>
                  <select
                    className={`${fieldSelect} max-w-xs`}
                    value={list.ordered ? "ordered" : "unordered"}
                    disabled={!editable}
                    onChange={(e) =>
                      updateList(list.id, { ordered: e.target.value === "ordered" })
                    }
                  >
                    <option value="unordered">À puces</option>
                    <option value="ordered">Numérotée</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1">
                  <span className={fieldLabel}>Titre de la liste (au-dessus)</span>
                  <input
                    type="text"
                    className={fieldInput}
                    value={list.title}
                    disabled={!editable}
                    placeholder="Optionnel"
                    onChange={(e) => updateList(list.id, { title: e.target.value })}
                  />
                </label>

                <label className="inline-flex items-center gap-2 text-sm text-form-text">
                  <input
                    type="checkbox"
                    checked={list.titleBold}
                    disabled={!editable}
                    onChange={(e) => updateList(list.id, { titleBold: e.target.checked })}
                    className="rounded border-form-border"
                  />
                  Titre en gras
                </label>

                <div className="flex flex-col gap-2">
                  <span className={fieldLabel}>Éléments</span>
                  {list.items.map((item, itemIndex) => (
                    <div key={`${list.id}-${itemIndex}`} className="flex gap-2">
                      <input
                        type="text"
                        className={fieldInput}
                        value={item}
                        disabled={!editable}
                        placeholder={`Élément ${itemIndex + 1}`}
                        onChange={(e) =>
                          updateListItem(list.id, itemIndex, e.target.value)
                        }
                      />
                      {editable && list.items.length > 1 ? (
                        <button
                          type="button"
                          className="shrink-0 rounded border border-form-border px-2 text-xs text-form-text-muted hover:bg-form-overlay"
                          onClick={() => removeListItem(list.id, itemIndex)}
                          aria-label={`Supprimer l'élément ${itemIndex + 1}`}
                        >
                          −
                        </button>
                      ) : null}
                    </div>
                  ))}
                  {editable ? (
                    <button
                      type="button"
                      className="self-start text-xs font-medium text-form-accent hover:underline"
                      onClick={() => addListItem(list.id)}
                    >
                      + Ajouter un élément
                    </button>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editable ? (
        <button
          type="button"
          className="self-start text-sm font-medium text-form-text hover:underline"
          onClick={addList}
        >
          + Ajouter une liste
        </button>
      ) : null}
    </div>
  );
};
