"use client";

import React, { startTransition, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useT } from "next-i18next/client";
import { localePrefixFromPathname } from "@/lib/locale-path";
import { AppRoleCode } from "@/lib/app-role-code";
import {
  messageFromNestBody,
  postAuthLogin,
} from "@/lib/auth-api";

const inputBase =
  "w-full bg-white placeholder:text-gray-500 text-gray-700 text-sm border border-slate-200 rounded-md px-3 py-2 transition duration-300 ease focus:outline-none focus:border-slate-400 hover:border-slate-300 shadow-sm focus:shadow";

type PostLoginTarget =
  | "welcome-admin"
  | "welcome-hunter"
  | "welcome-quality-checker"
  | "welcome-mentor"
  | "welcome-coordinator";

/**
 * Maps the `roleCode` returned by `POST /api/session` to a dashboard slug.
 * The BFF already rejected any role outside the allow-list (see
 * `APP_LOGIN_ALLOWED_ROLES`) before setting the cookie, so this only needs
 * to fan out the allowed roles. The `null` branch is defensive — it fires
 * only if a future role is added to the BFF allow-list before this mapping
 * is updated.
 */
function dashboardSlugForRole(roleCode: unknown): PostLoginTarget | null {
  if (roleCode === AppRoleCode.SUPER_ADMIN) return "welcome-admin";
  if (roleCode === AppRoleCode.HUNTER) return "welcome-hunter";
  if (roleCode === AppRoleCode.QUALITY_CHECKER) return "welcome-quality-checker";
  if (roleCode === AppRoleCode.MENTOR) return "welcome-mentor";
  if (roleCode === AppRoleCode.COORDINATOR) return "welcome-coordinator";
  return null;
}

export function LoginForm() {
  const { t } = useT(["connexion", "common"]);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const prefix = localePrefixFromPathname(pathname);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"credentials" | "totp">("credentials");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (searchParams.get("passwordReset") !== "success") {
      return;
    }
    startTransition(() => {
      setStatus("success");
      setMessage(t("loginForm.afterPasswordReset"));
    });
    router.replace(`${prefix}/login`, { scroll: false });
  }, [searchParams, router, prefix, t]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await postAuthLogin({
        email,
        password,
        code: step === "totp" ? code.trim() || undefined : undefined,
      });
      let data: unknown;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        const errorText = messageFromNestBody(data, t("loginForm.errorLogin"));
        if (step === "credentials" && /totp code required/i.test(errorText)) {
          setStep("totp");
          setStatus("idle");
          setMessage(t("loginForm.totpStepPrompt"));
          return;
        }
        setStatus("error");
        setMessage(errorText);
        return;
      }

      const nest = data as { token?: string };
      const token = nest.token?.trim();
      if (!token) {
        setStatus("error");
        setMessage(t("loginForm.errorLogin"));
        return;
      }

      const lng = prefix.replace(/^\//, "") || "en";
      const sessionRes = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ token, lng }),
      });
      const sessionData: unknown = await sessionRes.json().catch(() => null);

      /**
       * The BFF refuses to set the cookie for roles outside the allow-list,
       * so no session exists on the browser when we hit this branch — nothing
       * to revoke client-side.
       */
      if (sessionRes.status === 403) {
        setStatus("error");
        setMessage(t("loginForm.errorRoleNotAllowed"));
        return;
      }

      if (!sessionRes.ok) {
        setStatus("error");
        setMessage(t("loginForm.errorLogin"));
        return;
      }

      const roleCode =
        sessionData && typeof sessionData === "object"
          ? (sessionData as Record<string, unknown>).roleCode
          : null;
      const target = dashboardSlugForRole(roleCode);
      if (target === null) {
        setStatus("error");
        setMessage(t("loginForm.errorRoleNotAllowed"));
        return;
      }

      setStatus("success");
      router.replace(`${prefix}/${target}`);
    } catch {
      setStatus("error");
      setMessage(t("common:errors.network"));
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 w-full max-w-sm"
      noValidate
    >
      <div>
        <label htmlFor="login-email" className="block text-sm font-medium text-white mb-1">
          {t("loginForm.emailLabel")}
        </label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputBase}
          placeholder={t("loginForm.emailPlaceholder")}
          required
          autoComplete="email"
          disabled={status === "loading" || step === "totp"}
        />
      </div>
      <div>
        <label htmlFor="login-password" className="block text-sm font-medium text-white mb-1">
          {t("loginForm.passwordLabel")}
        </label>
        <input
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputBase}
          placeholder={t("loginForm.passwordPlaceholder")}
          required
          autoComplete="current-password"
          disabled={status === "loading" || step === "totp"}
        />
      </div>
      {step === "credentials" ? (
        <p className="text-right text-sm">
          <Link
            href={`${prefix}/forgot-password`}
            className="text-white/90 underline-offset-2 hover:text-white hover:underline"
          >
            {t("loginForm.forgotPasswordLink")}
          </Link>
        </p>
      ) : null}
      {step === "totp" ? (
        <div>
          <label htmlFor="login-code" className="block text-sm font-medium text-white mb-1">
            {t("loginForm.totpCodeLabel")}
          </label>
          <input
            id="login-code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
            className={inputBase}
            placeholder={t("loginForm.totpCodePlaceholder")}
            autoComplete="one-time-code"
            inputMode="numeric"
            disabled={status === "loading"}
          />
        </div>
      ) : null}

      {message && (
        <p
          role="alert"
          className={`text-sm ${status === "error" ? "text-red-200" : "text-green-200"}`}
        >
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "loading" || (step === "totp" && code.trim().length < 6)}
        className="btn-common-styles btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "loading"
          ? t("loginForm.submitting")
          : step === "totp"
            ? t("loginForm.submitTotp")
            : t("loginForm.submit")}
      </button>

      {step === "totp" ? (
        <button
          type="button"
          onClick={() => {
            setStep("credentials");
            setCode("");
            setMessage("");
            setStatus("idle");
          }}
          className="btn-common-styles bg-white/10 text-white hover:bg-white/20"
          disabled={status === "loading"}
        >
          {t("loginForm.backToPassword")}
        </button>
      ) : null}

      <p className="text-sm text-white/80">
        {t("loginForm.noAccount")}{" "}
      </p>
    </form>
  );
}
