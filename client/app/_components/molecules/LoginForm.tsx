"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useT } from "next-i18next/client";
import { localePrefixFromPathname } from "@/lib/locale-path";

const inputBase =
  "w-full bg-white placeholder:text-gray-500 text-gray-700 text-sm border border-slate-200 rounded-md px-3 py-2 transition duration-300 ease focus:outline-none focus:border-slate-400 hover:border-slate-300 shadow-sm focus:shadow";

export function LoginForm() {
  const { t } = useT("connexion");
  const router = useRouter();
  const pathname = usePathname();
  const prefix = localePrefixFromPathname(pathname);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? t("loginForm.errorLogin"));
        return;
      }

      setStatus("success");
      setMessage(data.message ?? t("loginForm.successLogin"));
      router.replace(prefix);
    } catch {
      setStatus("error");
      setMessage(t("errors.network"));
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
          disabled={status === "loading"}
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
          disabled={status === "loading"}
        />
      </div>

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
        disabled={status === "loading"}
        className="btn-common-styles btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "loading" ? t("loginForm.submitting") : t("loginForm.submit")}
      </button>

      <p className="text-sm text-white/80">
        {t("loginForm.noAccount")}{" "}
        <Link
          href={`${prefix}/register`}
          className="underline hover:text-white focus:outline-none focus:ring-2 focus:ring-white rounded"
        >
          {t("loginForm.registerLink")}
        </Link>
      </p>
    </form>
  );
}
