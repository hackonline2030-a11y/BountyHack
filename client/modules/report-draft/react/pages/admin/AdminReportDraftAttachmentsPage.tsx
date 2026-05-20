"use client";

import Link from "next/link";
import { type FC, useCallback, useEffect, useState } from "react";
import { fetchBff } from "@/lib/bff-fetch";
import { readFriendlyHttpError } from "@/lib/http-error-message";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { STEP_TITLE_FR } from "@modules/report-draft/core/model/step-field-catalog";
import { IconActionButton } from "@modules/app/nextjs/components/buttons/IconActionButton";
import { TrashIcon } from "@modules/report-team/react/icons";

const STATE_KEY_TO_STEP_LABEL: Record<string, string> = {
  meta: STEP_TITLE_FR[ReportDraftDomainModel.ReportDraftStep.META],
  description: STEP_TITLE_FR[ReportDraftDomainModel.ReportDraftStep.DESCRIPTION],
  collection: STEP_TITLE_FR[ReportDraftDomainModel.ReportDraftStep.COLLECTION],
  exploitation: STEP_TITLE_FR[ReportDraftDomainModel.ReportDraftStep.EXPLOITATION],
  proofOfConcept: STEP_TITLE_FR[ReportDraftDomainModel.ReportDraftStep.PROOF_OF_CONCEPT],
  risks: STEP_TITLE_FR[ReportDraftDomainModel.ReportDraftStep.RISKS],
  remediation: STEP_TITLE_FR[ReportDraftDomainModel.ReportDraftStep.REMEDIATION],
  final: STEP_TITLE_FR[ReportDraftDomainModel.ReportDraftStep.FINAL],
};

export type AdminAttachmentRow = {
  attachmentId: string;
  reportDraftId: string;
  reportTitle: string;
  reportTeamLabel: string | null;
  stepKey: string;
  storageKey: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  uploadedBy: string;
};

type Props = {
  lng: string;
};

export const AdminReportDraftAttachmentsPage: FC<Props> = ({ lng }) => {
  const [rows, setRows] = useState<AdminAttachmentRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    const res = await fetchBff("/api/report-draft/admin/attachments", {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) {
      setLoadError(await readFriendlyHttpError(res, "Impossible de charger les pièces jointes."));
      return;
    }
    const data = (await res.json()) as AdminAttachmentRow[];
    setRows(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onDelete = async (attachmentId: string) => {
    if (!window.confirm("Supprimer définitivement cette pièce jointe ?")) return;
    setDeletingId(attachmentId);
    try {
      const res = await fetchBff(
        `/api/report-draft/admin/attachments/${encodeURIComponent(attachmentId)}`,
        { method: "DELETE", credentials: "include" },
      );
      if (!res.ok) {
        throw new Error(await readFriendlyHttpError(res, "Suppression impossible."));
      }
      setRows((current) => current.filter((r) => r.attachmentId !== attachmentId));
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Suppression impossible.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const stepLabel = (stepKey: string) => STATE_KEY_TO_STEP_LABEL[stepKey] ?? stepKey;

  return (
    <article className="flex w-full max-w-6xl flex-col gap-6">
      <header className="dashboard-card px-6 py-6">
        <Link
          href={`/${lng}/welcome-admin`}
          className="text-sm text-dashboard-accent hover:underline"
        >
          ← Administration
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-dashboard-text">
          Pièces jointes des brouillons
        </h1>
        <p className="mt-1 text-sm text-dashboard-text-muted">
          Inventaire global — accès authentifié super-admin uniquement. Les fichiers ne sont pas
          exposés publiquement.
        </p>
      </header>

      {loadError ? (
        <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
          {loadError}
        </p>
      ) : null}

      <div className="dashboard-card overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-dashboard-divider bg-dashboard-surface text-xs uppercase text-dashboard-text-muted">
            <tr>
              <th className="px-4 py-3">Équipe</th>
              <th className="px-4 py-3">Rapport</th>
              <th className="px-4 py-3">Étape</th>
              <th className="px-4 py-3">Fichier</th>
              <th className="px-4 py-3">Chemin (storage)</th>
              <th className="px-4 py-3">Taille</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-dashboard-text-muted">
                  Aucune pièce jointe.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.attachmentId}
                  className="border-b border-dashboard-divider last:border-0"
                >
                  <td className="px-4 py-3">{row.reportTeamLabel ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/${lng}/report-draft/${row.reportDraftId}`}
                      className="text-dashboard-accent hover:underline"
                    >
                      {row.reportTitle}
                    </Link>
                    <p className="font-mono text-[10px] text-dashboard-text-muted">
                      {row.reportDraftId}
                    </p>
                  </td>
                  <td className="px-4 py-3">{stepLabel(row.stepKey)}</td>
                  <td className="px-4 py-3">{row.filename}</td>
                  <td className="max-w-xs px-4 py-3 font-mono text-[10px] break-all text-dashboard-text-muted">
                    {row.storageKey}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {(row.sizeBytes / 1024).toFixed(1)} Ko
                  </td>
                  <td className="px-4 py-3">
                    <IconActionButton
                      variant="danger"
                      aria-label="Supprimer"
                      title="Supprimer"
                      disabled={deletingId === row.attachmentId}
                      onClick={() => void onDelete(row.attachmentId)}
                    >
                      <TrashIcon className="size-4" />
                    </IconActionButton>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </article>
  );
};
