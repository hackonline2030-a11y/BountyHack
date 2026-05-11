"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "next-i18next/client";
import { createTotpManagementDependencies } from "@/modules/auth/core/totp-management.factory";
import {
  confirmTotpEnrollmentUseCase,
  disableTotpEnrollmentUseCase,
  startTotpEnrollmentUseCase,
} from "@/modules/auth/core/usecase/totp-management.usecase";

type TotpStartOk = {
  secret: string;
  otpauthUri: string;
  secretQrCode: string;
};

function isTotpStartOk(data: unknown): data is TotpStartOk {
  if (!data || typeof data !== "object") {
    return false;
  }
  const o = data as Record<string, unknown>;
  return (
    typeof o.secret === "string" &&
    typeof o.otpauthUri === "string" &&
    typeof o.secretQrCode === "string"
  );
}

function OtpRow({
  disabled,
  onDigitsChange,
}: {
  disabled: boolean;
  onDigitsChange: (six: string) => void;
}) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const syncParent = useCallback(() => {
    const six = inputsRef.current
      .map((el) => (el?.value.replace(/\D/g, "").slice(-1) ?? ""))
      .join("");
    onDigitsChange(six);
  }, [onDigitsChange]);

  return (
    <div className="flex justify-between gap-2">
      {[0, 1, 2, 3, 4, 5].map((idx) => (
        <input
          key={idx}
          ref={(el) => {
            inputsRef.current[idx] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          disabled={disabled}
          autoComplete="one-time-code"
          className="h-11 w-10 rounded-lg border border-slate-200 text-center text-base font-semibold text-slate-900 shadow-sm focus:border-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-500/30 disabled:opacity-60"
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !e.currentTarget.value && idx > 0) {
              inputsRef.current[idx - 1]?.focus();
            }
          }}
          onInput={(e) => {
            const v = e.currentTarget.value.replace(/\D/g, "").slice(-1);
            e.currentTarget.value = v;
            syncParent();
            if (v && idx < 5) {
              inputsRef.current[idx + 1]?.focus();
            }
          }}
          onPaste={(e) => {
            e.preventDefault();
            const t =
              e.clipboardData?.getData("text")?.replace(/\D/g, "").slice(0, 6) ?? "";
            for (let j = 0; j < 6; j++) {
              if (inputsRef.current[j]) {
                inputsRef.current[j]!.value = t[j] ?? "";
              }
            }
            syncParent();
            inputsRef.current[Math.min(t.length, 5)]?.focus();
          }}
        />
      ))}
    </div>
  );
}

type TotpEnrollmentPanelProps = {
  initialTotpEnabled?: boolean;
};

export function TotpEnrollmentPanel({
  initialTotpEnabled = false,
}: TotpEnrollmentPanelProps) {
  const totpDeps = createTotpManagementDependencies();
  const { t } = useT("parameters");
  const router = useRouter();
  const [totpEnabled, setTotpEnabled] = useState(initialTotpEnabled);
  const [startPhase, setStartPhase] = useState<"idle" | "loading" | "ready">("idle");
  const [confirmPhase, setConfirmPhase] = useState<"idle" | "loading">("idle");
  const [disablePhase, setDisablePhase] = useState<"idle" | "loading">("idle");
  const [enroll, setEnroll] = useState<TotpStartOk | null>(null);
  const [otpDigits, setOtpDigits] = useState("");
  const [disableOpen, setDisableOpen] = useState(false);
  const [disableOtpDigits, setDisableOtpDigits] = useState("");
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(
    null,
  );

  useEffect(() => {
    setTotpEnabled(initialTotpEnabled);
  }, [initialTotpEnabled]);

  const start = async () => {
    setMessage(null);
    setStartPhase("loading");
    try {
      const res = await startTotpEnrollmentUseCase(totpDeps);
      const data: unknown = await res.json().catch(() => null);
      if (res.status === 401) {
        setMessage({ kind: "err", text: t("statusUnauthorized") });
        setStartPhase("idle");
        return;
      }
      if (res.status === 501) {
        setMessage({ kind: "err", text: t("statusNestUnavailable") });
        setStartPhase("idle");
        return;
      }
      if (!res.ok || !isTotpStartOk(data)) {
        setMessage({
          kind: "err",
          text: t("nestError", { status: res.status }),
        });
        setStartPhase("idle");
        return;
      }
      setOtpDigits("");
      setEnroll(data);
      setStartPhase("ready");
      setMessage(null);
    } catch {
      setMessage({ kind: "err", text: t("statusGenericError") });
      setStartPhase("idle");
    }
  };

  const confirm = async () => {
    if (otpDigits.replace(/\D/g, "").length !== 6) {
      return;
    }
    setMessage(null);
    setConfirmPhase("loading");
    try {
      const code = otpDigits.replace(/\D/g, "").slice(0, 8);
      const res = await confirmTotpEnrollmentUseCase(totpDeps, code);
      const data: unknown = await res.json().catch(() => null);
      if (res.status === 401) {
        setMessage({ kind: "err", text: t("statusUnauthorized") });
        setConfirmPhase("idle");
        return;
      }
      if (
        res.ok &&
        data &&
        typeof data === "object" &&
        (data as Record<string, unknown>).ok === true
      ) {
        setTotpEnabled(true);
        setEnroll(null);
        setStartPhase("idle");
        setOtpDigits("");
        setDisableOpen(false);
        setMessage({ kind: "ok", text: t("statusSuccess") });
        setConfirmPhase("idle");
        router.refresh();
        return;
      }
      if (res.status === 401 || (data && JSON.stringify(data).includes("Invalid TOTP"))) {
        setMessage({ kind: "err", text: t("statusInvalidCode") });
        setConfirmPhase("idle");
        return;
      }
      setMessage({
        kind: "err",
        text: t("nestError", { status: res.status }),
      });
      setConfirmPhase("idle");
    } catch {
      setMessage({ kind: "err", text: t("statusGenericError") });
      setConfirmPhase("idle");
    }
  };

  const disable = async () => {
    if (disableOtpDigits.replace(/\D/g, "").length !== 6) {
      return;
    }
    setMessage(null);
    setDisablePhase("loading");
    try {
      const code = disableOtpDigits.replace(/\D/g, "").slice(0, 8);
      const res = await disableTotpEnrollmentUseCase(totpDeps, code);
      const data: unknown = await res.json().catch(() => null);
      if (res.status === 401) {
        setMessage({ kind: "err", text: t("statusInvalidCode") });
        setDisablePhase("idle");
        return;
      }
      if (res.status === 501) {
        setMessage({ kind: "err", text: t("statusNestUnavailable") });
        setDisablePhase("idle");
        return;
      }
      if (
        res.ok &&
        data &&
        typeof data === "object" &&
        (data as Record<string, unknown>).ok === true
      ) {
        setTotpEnabled(false);
        setDisableOpen(false);
        setDisableOtpDigits("");
        setMessage({ kind: "ok", text: t("statusDisabledSuccess") });
        setDisablePhase("idle");
        router.refresh();
        return;
      }
      const bodyStr = data ? JSON.stringify(data) : "";
      if (res.status === 400 && bodyStr.includes("totp_not_enabled")) {
        setMessage({ kind: "err", text: t("statusGenericError") });
        setDisablePhase("idle");
        return;
      }
      setMessage({
        kind: "err",
        text: t("nestError", { status: res.status }),
      });
      setDisablePhase("idle");
    } catch {
      setMessage({ kind: "err", text: t("statusGenericError") });
      setDisablePhase("idle");
    }
  };

  const busy =
    startPhase === "loading" ||
    confirmPhase === "loading" ||
    disablePhase === "loading";

  const toggleClicked = () => {
    if (busy) {
      return;
    }
    setMessage(null);
    if (totpEnabled) {
      setDisableOpen(true);
      setDisableOtpDigits("");
      return;
    }
    void start();
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">{t("totpHeading")}</h3>

      <div className="mt-4 flex items-center justify-between gap-4 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-900">{t("totpSwitchLabel")}</p>
          <p className="mt-0.5 text-xs text-slate-500">{t("totpSwitchHint")}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={totpEnabled}
          disabled={busy}
          onClick={toggleClicked}
          className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
            totpEnabled ? "bg-violet-600" : "bg-slate-300"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow transition ${
              totpEnabled ? "translate-x-7" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {!totpEnabled ? (
        <p className="mt-3 text-sm leading-relaxed text-slate-600">{t("totpLead")}</p>
      ) : null}

      {message ? (
        <p
          className={`mt-4 text-sm ${
            message.kind === "ok" ? "text-emerald-700" : "text-red-600"
          }`}
          role="status"
        >
          {message.text}
        </p>
      ) : null}

      {totpEnabled && disableOpen ? (
        <div className="mt-5 space-y-4 border-t border-slate-100 pt-5">
          <p className="text-sm text-slate-600">{t("disableLead")}</p>
          <OtpRow
            key="disable-otp"
            disabled={busy}
            onDigitsChange={(six) => setDisableOtpDigits(six)}
          />
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={disable}
              disabled={busy || disableOtpDigits.replace(/\D/g, "").length !== 6}
              className="rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {disablePhase === "loading" ? t("statusDisabling") : t("btnDisable")}
            </button>
            <button
              type="button"
              onClick={() => {
                setDisableOpen(false);
                setDisableOtpDigits("");
                setMessage(null);
              }}
              disabled={busy}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed"
            >
              {t("btnCancelDisable")}
            </button>
          </div>
        </div>
      ) : null}

      {!totpEnabled ? (
        <>
          <div className="mt-5">
            <button
              type="button"
              onClick={() => {
                void start();
              }}
              disabled={busy}
              className="rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {startPhase === "loading" ? t("statusStarting") : t("btnStart")}
            </button>
          </div>

          {enroll ? (
            <div className="mt-6 space-y-4 border-t border-slate-100 pt-6">
              <p className="text-sm text-slate-600">{t("hintScan")}</p>
              {/* eslint-disable-next-line @next/next/no-img-element -- data URL from Nest */}
              <img
                src={enroll.secretQrCode}
                alt=""
                className="mx-auto block max-w-[200px]"
              />
              <details className="text-sm">
                <summary className="cursor-pointer font-medium text-violet-700">
                  {t("manualToggle")}
                </summary>
                <p className="mt-2 text-xs font-medium text-slate-500">{t("secretLabel")}</p>
                <pre className="mt-1 overflow-x-auto rounded-lg bg-slate-100 p-3 text-xs">
                  {enroll.secret}
                </pre>
                <p className="mt-2 text-xs font-medium text-slate-500">{t("uriLabel")}</p>
                <pre className="mt-1 overflow-x-auto rounded-lg bg-slate-100 p-3 text-[0.65rem]">
                  {enroll.otpauthUri}
                </pre>
              </details>

              <div>
                <p className="text-sm text-slate-600">{t("enterCode")}</p>
                <div className="mt-3">
                  <OtpRow
                    key={enroll.secret}
                    disabled={busy}
                    onDigitsChange={(six) => setOtpDigits(six)}
                  />
                </div>
                <button
                  type="button"
                  onClick={confirm}
                  disabled={busy || otpDigits.replace(/\D/g, "").length !== 6}
                  className="mt-5 rounded-lg border border-violet-600 bg-white px-4 py-2.5 text-sm font-semibold text-violet-700 shadow-sm transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {confirmPhase === "loading" ? t("statusConfirming") : t("btnConfirm")}
                </button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
