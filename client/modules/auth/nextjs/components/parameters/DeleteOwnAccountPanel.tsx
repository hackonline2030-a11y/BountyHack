"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useT } from "next-i18next/client";
import { localePrefixFromPathname } from "@/lib/locale-path";
import { AppRoleCode } from "@/lib/app-role-code";
import { ConfirmDangerModal } from "@modules/app/nextjs/components/ConfirmDangerModal";
import { TotpCodeInput } from "@/modules/auth/nextjs/components/parameters/TotpCodeInput";

type DeleteOwnAccountPanelProps = {
  roleCode: string | null;
  twoFactorEnabled?: boolean;
};

function messageFromResponse(body: unknown, fallback: string): string {
  if (
    body &&
    typeof body === "object" &&
    typeof (body as { message?: unknown }).message === "string"
  ) {
    return (body as { message: string }).message;
  }
  return fallback;
}

function verifyStepUpError(
  res: Response,
  body: unknown,
  wrongPassword: string,
  invalidTotp: string,
  fallback: string,
): string {
  const msg = messageFromResponse(body, "").toLowerCase();
  if (msg.includes("totp")) {
    return invalidTotp;
  }
  if (res.status === 401) {
    return wrongPassword;
  }
  return messageFromResponse(body, fallback);
}

export function DeleteOwnAccountPanel({
  roleCode,
  twoFactorEnabled = false,
}: DeleteOwnAccountPanelProps) {
  const { t } = useT(["parameters", "common"]);
  const router = useRouter();
  const pathname = usePathname();
  const prefix = localePrefixFromPathname(pathname);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [stepUpToken, setStepUpToken] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);

  async function verifyPassword() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/account/verify-password", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          ...(twoFactorEnabled && totpCode.length === 6 ? { totpCode } : {}),
        }),
      });
      const body: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        setError(
          verifyStepUpError(
            res,
            body,
            t("parameters:deleteAccount.wrongPassword"),
            t("parameters:deleteAccount.invalidTotp"),
            t("parameters:deleteAccount.verifyFailed"),
          ),
        );
        setBusy(false);
        return;
      }
      const token =
        body &&
        typeof body === "object" &&
        typeof (body as { stepUpToken?: unknown }).stepUpToken === "string"
          ? (body as { stepUpToken: string }).stepUpToken
          : null;
      if (!token) {
        setError(t("parameters:deleteAccount.verifyFailed"));
        setBusy(false);
        return;
      }
      setStepUpToken(token);
      setVerified(true);
      setPassword("");
      setTotpCode("");
      setBusy(false);
    } catch {
      setError(t("parameters:deleteAccount.verifyFailed"));
      setBusy(false);
    }
  }

  async function performDelete() {
    if (!stepUpToken) {
      setError(t("parameters:deleteAccount.sessionExpired"));
      setVerified(false);
      setConfirmOpen(false);
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/account", {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepUpToken }),
      });
      if (!res.ok) {
        let message = t("parameters:deleteAccount.failed");
        try {
          const body: unknown = await res.json();
          message = messageFromResponse(body, message);
        } catch {
          /* keep default */
        }
        if (res.status === 401) {
          setVerified(false);
          setStepUpToken(null);
          message = t("parameters:deleteAccount.sessionExpired");
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

  function resetVerification() {
    setVerified(false);
    setStepUpToken(null);
    setPassword("");
    setTotpCode("");
    setError(null);
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
        <p className="mt-2 text-sm text-rose-950/90">
          {t("parameters:deleteAccount.passwordRequired")}
        </p>

        {error ? (
          <p role="alert" className="mt-3 text-sm text-rose-800">
            {error}
          </p>
        ) : null}

        {!verified ? (
          <div className="mt-4 space-y-3">
            <label className="block text-sm font-medium text-rose-950">
              {t("parameters:deleteAccount.currentPasswordLabel")}
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={busy}
                className="mt-1 block w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/30 disabled:opacity-60"
              />
            </label>
            {twoFactorEnabled ? (
              <div>
                <p className="text-sm font-medium text-rose-950">
                  {t("parameters:deleteAccount.totpLabel")}
                </p>
                <p className="mt-1 text-xs text-rose-900/80">
                  {t("parameters:deleteAccount.totpHint")}
                </p>
                <div className="mt-2">
                  <TotpCodeInput disabled={busy} onDigitsChange={setTotpCode} />
                </div>
              </div>
            ) : null}
            <button
              type="button"
              className="cursor-pointer rounded-md border border-rose-400 bg-white px-4 py-2 text-sm font-semibold text-rose-900 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => void verifyPassword()}
              disabled={
                busy ||
                !password.trim() ||
                (twoFactorEnabled && totpCode.length !== 6)
              }
            >
              {busy
                ? t("parameters:deleteAccount.verifying")
                : t("parameters:deleteAccount.verifyButton")}
            </button>
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="cursor-pointer rounded-md border border-rose-400 bg-white px-4 py-2 text-sm font-semibold text-rose-900 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => setConfirmOpen(true)}
              disabled={busy}
            >
              {busy ? t("parameters:deleteAccount.deleting") : t("parameters:deleteAccount.button")}
            </button>
            <button
              type="button"
              className="cursor-pointer rounded-md border border-rose-300 px-4 py-2 text-sm font-medium text-rose-900 transition hover:bg-rose-100/80 disabled:opacity-50"
              onClick={resetVerification}
              disabled={busy}
            >
              {t("parameters:deleteAccount.cancelVerification")}
            </button>
          </div>
        )}
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
