"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useT } from "next-i18next/client";
import { localePrefixFromPathname } from "@/lib/locale-path";
import { TotpCodeInput } from "@/modules/auth/nextjs/components/parameters/TotpCodeInput";

type ProfileSettingsPanelProps = {
  initialUsername: string;
  initialEmail: string | null;
  twoFactorEnabled?: boolean;
};

type Step = "password" | "edit";

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

export function ProfileSettingsPanel({
  initialUsername,
  initialEmail,
  twoFactorEnabled = false,
}: ProfileSettingsPanelProps) {
  const { t } = useT(["parameters", "common"]);
  const router = useRouter();
  const pathname = usePathname();
  const prefix = localePrefixFromPathname(pathname);

  const [step, setStep] = useState<Step>("password");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [stepUpToken, setStepUpToken] = useState<string | null>(null);

  const [username, setUsername] = useState(initialUsername);
  const [email, setEmail] = useState(initialEmail ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function verifyPassword() {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/account/profile/verify-password", {
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
            t("parameters:profile.wrongPassword"),
            t("parameters:profile.invalidTotp"),
            t("parameters:profile.verifyFailed"),
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
        setError(t("parameters:profile.verifyFailed"));
        setBusy(false);
        return;
      }
      setStepUpToken(token);
      setStep("edit");
      setPassword("");
      setTotpCode("");
      setBusy(false);
    } catch {
      setError(t("parameters:profile.verifyFailed"));
      setBusy(false);
    }
  }

  async function saveProfile() {
    if (!stepUpToken) {
      setError(t("parameters:profile.sessionExpired"));
      setStep("password");
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      setError(t("parameters:profile.passwordMismatch"));
      return;
    }

    const patch: Record<string, string> = { stepUpToken };
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim().toLowerCase();
    if (trimmedUsername && trimmedUsername !== initialUsername.trim()) {
      patch.username = trimmedUsername;
    }
    if (trimmedEmail && trimmedEmail !== (initialEmail ?? "").trim().toLowerCase()) {
      patch.email = trimmedEmail;
    }
    if (newPassword.trim()) {
      patch.newPassword = newPassword.trim();
    }
    if (
      patch.username === undefined &&
      patch.email === undefined &&
      patch.newPassword === undefined
    ) {
      setError(t("parameters:profile.nothingToSave"));
      return;
    }

    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const body: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        setError(messageFromResponse(body, t("parameters:profile.saveFailed")));
        if (res.status === 401) {
          setStep("password");
          setStepUpToken(null);
        }
        setBusy(false);
        return;
      }

      const mustReLogin =
        patch.newPassword !== undefined || patch.email !== undefined;

      if (mustReLogin) {
        await fetch("/api/session", { method: "DELETE", credentials: "same-origin" });
        router.replace(`${prefix}/`);
        router.refresh();
        return;
      }

      setSuccess(t("parameters:profile.saveSuccess"));
      setNewPassword("");
      setConfirmPassword("");
      setStep("password");
      setStepUpToken(null);
      router.refresh();
      setBusy(false);
    } catch {
      setError(t("parameters:profile.saveFailed"));
      setBusy(false);
    }
  }

  return (
    <section className="mt-10 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        {t("parameters:profile.heading")}
      </h2>
      <p className="mt-2 text-sm text-slate-600">{t("parameters:profile.lead")}</p>

      {success ? (
        <p className="mt-3 text-sm text-emerald-700" role="status">
          {success}
        </p>
      ) : null}
      {error ? (
        <p className="mt-3 text-sm text-rose-700" role="alert">
          {error}
        </p>
      ) : null}

      {step === "password" ? (
        <div className="mt-4 space-y-3">
          <label className="block text-sm font-medium text-slate-700">
            {t("parameters:profile.currentPasswordLabel")}
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy}
              className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-500/30 disabled:opacity-60"
            />
          </label>
          {twoFactorEnabled ? (
            <div>
              <p className="text-sm font-medium text-slate-700">
                {t("parameters:profile.totpLabel")}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {t("parameters:profile.totpHint")}
              </p>
              <div className="mt-2">
                <TotpCodeInput disabled={busy} onDigitsChange={setTotpCode} />
              </div>
            </div>
          ) : null}
          <button
            type="button"
            disabled={
              busy ||
              !password.trim() ||
              (twoFactorEnabled && totpCode.length !== 6)
            }
            onClick={() => void verifyPassword()}
            className="rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-50"
          >
            {busy ? t("parameters:profile.verifying") : t("parameters:profile.verifyButton")}
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <label className="block text-sm font-medium text-slate-700">
            {t("parameters:profile.usernameLabel")}
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={busy}
              className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-500/30 disabled:opacity-60"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            {t("parameters:profile.emailLabel")}
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
              className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-500/30 disabled:opacity-60"
            />
          </label>
          <p className="text-xs text-slate-500">{t("parameters:profile.emailChangeHint")}</p>
          <label className="block text-sm font-medium text-slate-700">
            {t("parameters:profile.newPasswordLabel")}
            <input
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={busy}
              className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-500/30 disabled:opacity-60"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            {t("parameters:profile.confirmPasswordLabel")}
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={busy}
              className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-500/30 disabled:opacity-60"
            />
          </label>
          <p className="text-xs text-slate-500">{t("parameters:profile.passwordChangeHint")}</p>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              disabled={busy}
              onClick={() => void saveProfile()}
              className="rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-50"
            >
              {busy ? t("parameters:profile.saving") : t("parameters:profile.saveButton")}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setStep("password");
                setStepUpToken(null);
                setUsername(initialUsername);
                setEmail(initialEmail ?? "");
                setNewPassword("");
                setConfirmPassword("");
                setError(null);
                setSuccess(null);
              }}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {t("parameters:profile.cancelEdit")}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
