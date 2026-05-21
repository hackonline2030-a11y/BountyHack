"use client";

import { useCallback, useRef } from "react";

const OTP_LENGTH = 6;

type TotpCodeInputProps = {
  disabled?: boolean;
  onDigitsChange: (six: string) => void;
};

/** Six single-digit inputs for a TOTP code (settings step-up). */
export function TotpCodeInput({ disabled = false, onDigitsChange }: TotpCodeInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const syncParent = useCallback(() => {
    const six = inputsRef.current
      .map((el) => (el?.value.replace(/\D/g, "").slice(-1) ?? ""))
      .join("");
    onDigitsChange(six);
  }, [onDigitsChange]);

  return (
    <div className="flex gap-2">
      {Array.from({ length: OTP_LENGTH }, (_, idx) => (
        <input
          key={`step-up-otp-${idx}`}
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
            if (v && idx < OTP_LENGTH - 1) {
              inputsRef.current[idx + 1]?.focus();
            }
          }}
          onPaste={(e) => {
            e.preventDefault();
            const t =
              e.clipboardData?.getData("text")?.replace(/\D/g, "").slice(0, OTP_LENGTH) ?? "";
            for (let j = 0; j < OTP_LENGTH; j++) {
              if (inputsRef.current[j]) {
                inputsRef.current[j]!.value = t[j] ?? "";
              }
            }
            syncParent();
            inputsRef.current[Math.min(t.length, OTP_LENGTH - 1)]?.focus();
          }}
        />
      ))}
    </div>
  );
}
