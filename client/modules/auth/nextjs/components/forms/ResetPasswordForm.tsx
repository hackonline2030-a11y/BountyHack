"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useT } from "next-i18next/client";
import { localePrefixFromPathname } from "@/lib/locale-path";
import { messageFromNestBody } from "@/lib/auth-api";
import { createPasswordResetDependencies } from "@modules/auth/core/password-reset.factory";
import { completePasswordResetUseCase } from "@modules/auth/core/usecase/password-reset.usecase";

const inputBase =
  "w-full bg-white placeholder:text-gray-500 text-gray-700 text-sm border border-slate-200 rounded-md px-3 py-2 transition duration-300 ease focus:outline-none focus:border-slate-400 hover:border-slate-300 shadow-sm focus:shadow";

type Props = {
  tokenFromQuery: string;
};

export function ResetPasswordForm({ tokenFromQuery }: Props) {
  const { t } = useT("passwordReset");
  const router = useRouter();
  const pathname = usePathname();
  const prefix = localePrefixFromPathname(pathname);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const deps = useMemo(() => createPasswordResetDependencies(), []);
  const token = tokenFromQuery.trim();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    if (password !== confirm) {
      setStatus("error");
      setMessage(t("resetForm.passwordMismatch"));
      return;
    }

    try {
      const res = await completePasswordResetUseCase(deps, {
        token,
        password,
      });
      let data: unknown;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        setStatus("error");
        setMessage(messageFromNestBody(data, t("resetForm.errorGeneric")));
        return;
      }

      setStatus("success");
      router.replace(`${prefix}/login?passwordReset=success`);
    } catch {
      setStatus("error");
      setMessage(t("resetForm.errorNetwork"));
    }
  }

  if (!token) {
    return (
      <div className="flex w-full max-w-sm flex-col gap-4 text-center">
        <p className="text-sm text-red-200" role="alert">
          {t("resetPage.missingToken")}
        </p>
        <Link
          href={`${prefix}/forgot-password`}
          className="text-sm text-white/90 underline-offset-2 hover:underline"
        >
          {t("resetPage.requestNewLink")}
        </Link>
        <Link
          href={`${prefix}/login`}
          className="text-sm text-white/80 hover:text-white hover:underline"
        >
          {t("resetForm.backToLogin")}
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-sm flex-col gap-4"
      noValidate
    >
      <div>
        <label htmlFor="reset-password" className="mb-1 block text-sm font-medium text-white">
          {t("resetForm.passwordLabel")}
        </label>
        <input
          id="reset-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputBase}
          placeholder={t("resetForm.passwordPlaceholder")}
          required
          minLength={8}
          autoComplete="new-password"
          disabled={status === "loading"}
        />
      </div>
      <div>
        <label htmlFor="reset-confirm" className="mb-1 block text-sm font-medium text-white">
          {t("resetForm.confirmLabel")}
        </label>
        <input
          id="reset-confirm"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={inputBase}
          placeholder={t("resetForm.confirmPlaceholder")}
          required
          minLength={8}
          autoComplete="new-password"
          disabled={status === "loading"}
        />
      </div>

      {message ? (
        <p role="alert" className="text-sm text-red-200">
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "loading" || password.length < 8 || confirm.length < 8}
        className="btn-common-styles btn-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === "loading" ? t("resetForm.submitting") : t("resetForm.submit")}
      </button>

      <Link
        href={`${prefix}/login`}
        className="text-center text-sm text-white/80 underline-offset-2 hover:text-white hover:underline"
      >
        {t("resetForm.backToLogin")}
      </Link>
    </form>
  );
}
