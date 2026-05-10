"use client";

import React, { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "next-i18next/client";

const API_START = "/api/account/totp/enable/start";
const API_CONFIRM = "/api/account/totp/enable/confirm";

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

export function TotpEnrollmentPanel() {
  const { t } = useT("parameters");
  const router = useRouter();
  const [startPhase, setStartPhase] = useState<"idle" | "loading" | "ready">("idle");
  const [confirmPhase, setConfirmPhase] = useState<"idle" | "loading">("idle");
  const [enroll, setEnroll] = useState<TotpStartOk | null>(null);
  const [otpDigits, setOtpDigits] = useState("");
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(
    null,
  );

  const start = async () => {
    setMessage(null);
    setStartPhase("loading");
    try {
      const res = await fetch(API_START, {
        method: "POST",
        credentials: "include",
      });
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
      const res = await fetch(API_CONFIRM, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
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
        setDone(true);
        setEnroll(null);
        setStartPhase("idle");
        setOtpDigits("");
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

  const busy = startPhase === "loading" || confirmPhase === "loading";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">{t("totpHeading")}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{t("totpLead")}</p>

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

      {done ? null : (
        <>
          <div className="mt-5">
            <button
              type="button"
              onClick={start}
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
      )}
    </div>
  );
}
