"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useT } from "next-i18next/client";
import { localePrefixFromPathname } from "@/lib/locale-path";
import { AppRoleCode } from "@/lib/app-role-code";

type DeleteOwnAccountPanelProps = {
  roleCode: string | null;
};

export function DeleteOwnAccountPanel({ roleCode }: DeleteOwnAccountPanelProps) {
  const { t } = useT("parameters");
  const router = useRouter();
  const pathname = usePathname();
  const prefix = localePrefixFromPathname(pathname);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDelete() {
    if (busy) return;
    if (!window.confirm(t("deleteAccount.confirm"))) return;

    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/account", {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (!res.ok) {
        let message = t("deleteAccount.failed");
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
        return;
      }

      await fetch("/api/session", { method: "DELETE", credentials: "same-origin" });
      router.replace(`${prefix}/login`);
      router.refresh();
    } catch {
      setError(t("deleteAccount.failed"));
      setBusy(false);
    }
  }

  return (
    <section className="mt-10 rounded-lg border border-rose-200 bg-rose-50/60 p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-rose-900">
        {t("deleteAccount.heading")}
      </h2>
      <p className="mt-2 text-sm text-rose-950/90">{t("deleteAccount.lead")}</p>
      {roleCode === AppRoleCode.SUPER_ADMIN ? (
        <p className="mt-2 text-sm text-rose-950/90">
          {t("deleteAccount.leadLastSuperAdmin")}
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
        onClick={() => void onDelete()}
        disabled={busy}
      >
        {busy ? t("deleteAccount.deleting") : t("deleteAccount.button")}
      </button>
    </section>
  );
}
