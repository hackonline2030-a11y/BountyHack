"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useT } from "next-i18next/client";
import { localePrefixFromPathname } from "@/lib/locale-path";
import { AppRoleCode } from "@/lib/app-role-code";
import { ConfirmDangerModal } from "@modules/app/nextjs/components/ConfirmDangerModal";

type DeleteOwnAccountPanelProps = {
  roleCode: string | null;
};

export function DeleteOwnAccountPanel({ roleCode }: DeleteOwnAccountPanelProps) {
  const { t } = useT(["parameters", "common"]);
  const router = useRouter();
  const pathname = usePathname();
  const prefix = localePrefixFromPathname(pathname);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function performDelete() {
    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/account", {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (!res.ok) {
        let message = t("parameters:deleteAccount.failed");
        try {
          const body: unknown = await res.json();
          if (
            body &&
            typeof body === "object" &&
            typeof (body as { message?: unknown }).message === "string"
          ) {
            message = (body as { message: string }).message;
          }
        } catch {
          /* keep default */
        }
        setError(message);
        setBusy(false);
        setConfirmOpen(false);
        return;
      }

      await fetch("/api/session", { method: "DELETE", credentials: "same-origin" });
      router.replace(`${prefix}/login`);
      router.refresh();
    } catch {
      setError(t("parameters:deleteAccount.failed"));
      setBusy(false);
      setConfirmOpen(false);
    }
  }

  return (
    <>
      <section className="mt-10 rounded-lg border border-rose-200 bg-rose-50/60 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-rose-900">
          {t("parameters:deleteAccount.heading")}
        </h2>
        <p className="mt-2 text-sm text-rose-950/90">{t("parameters:deleteAccount.lead")}</p>
        <p className="mt-2 text-sm text-rose-950/90">
          {t("parameters:deleteAccount.leadTeamsAndReports")}
        </p>
        {roleCode === AppRoleCode.SUPER_ADMIN ? (
          <p className="mt-2 text-sm text-rose-950/90">
            {t("parameters:deleteAccount.leadLastSuperAdmin")}
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="mt-3 text-sm text-rose-800">
            {error}
          </p>
        ) : null}
        <button
          type="button"
          className="mt-4 cursor-pointer rounded-md border border-rose-400 bg-white px-4 py-2 text-sm font-semibold text-rose-900 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => setConfirmOpen(true)}
          disabled={busy}
        >
          {busy ? t("parameters:deleteAccount.deleting") : t("parameters:deleteAccount.button")}
        </button>
      </section>

      <ConfirmDangerModal
        open={confirmOpen}
        title={t("parameters:deleteAccount.confirmTitle")}
        cancelLabel={t("common:confirmModal.cancel")}
        confirmLabel={t("parameters:deleteAccount.confirmAction")}
        confirming={busy}
        confirmingLabel={t("parameters:deleteAccount.deleting")}
        onCancel={() => {
          if (!busy) setConfirmOpen(false);
        }}
        onConfirm={() => void performDelete()}
      >
        {t("parameters:deleteAccount.confirm")}
      </ConfirmDangerModal>
    </>
  );
}
