"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "next-i18next/client";
import { localePrefixFromPathname } from "@/lib/locale-path";
import { messageFromNestBody } from "@/lib/auth-api";
import { createPasswordResetDependencies } from "@modules/auth/core/password-reset.factory";
import { requestPasswordResetUseCase } from "@modules/auth/core/usecase/password-reset.usecase";
import type { PasswordResetEmailLocale } from "@modules/auth/core/gateway/password-reset.gateway";
import { isSupportedLanguage } from "@modules/auth/core/model/locale.policy";

const inputBase =
  "w-full bg-white placeholder:text-gray-500 text-gray-700 text-sm border border-slate-200 rounded-md px-3 py-2 transition duration-300 ease focus:outline-none focus:border-slate-400 hover:border-slate-300 shadow-sm focus:shadow";

export function ForgotPasswordForm() {
  const { t } = useT("passwordReset");
  const pathname = usePathname();
  const prefix = localePrefixFromPathname(pathname);
  const lng = prefix.replace(/^\//, "") || "en";
  const locale: PasswordResetEmailLocale = useMemo(() => {
    return isSupportedLanguage(lng) && lng === "fr" ? "fr" : "en";
  }, [lng]);

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const deps = useMemo(() => createPasswordResetDependencies(), []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await requestPasswordResetUseCase(deps, {
        email: email.trim().toLowerCase(),
        locale,
      });
      let data: unknown;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        setStatus("error");
        setMessage(messageFromNestBody(data, t("forgotForm.errorGeneric")));
        return;
      }

      setStatus("success");
      setMessage(t("forgotForm.successNeutral"));
    } catch {
      setStatus("error");
      setMessage(t("forgotForm.errorNetwork"));
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-sm flex-col gap-4"
      noValidate
    >
      <div>
        <label htmlFor="forgot-email" className="mb-1 block text-sm font-medium text-white">
          {t("forgotForm.emailLabel")}
        </label>
        <input
          id="forgot-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputBase}
          placeholder={t("forgotForm.emailPlaceholder")}
          required
          autoComplete="email"
          disabled={status === "loading" || status === "success"}
        />
      </div>

      {message ? (
        <p
          role="alert"
          className={`text-sm ${status === "error" ? "text-red-200" : "text-green-200"}`}
        >
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "loading" || status === "success"}
        className="btn-common-styles btn-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === "loading" ? t("forgotForm.submitting") : t("forgotForm.submit")}
      </button>

      <Link
        href={`${prefix}/login`}
        className="text-center text-sm text-white/80 underline-offset-2 hover:text-white hover:underline"
      >
        {t("forgotForm.backToLogin")}
      </Link>
    </form>
  );
}
