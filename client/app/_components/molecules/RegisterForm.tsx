"use client";

import React from "react";
import { useState, type SyntheticEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useT } from "next-i18next/client";
import { localePrefixFromPathname } from "@/lib/locale-path";

const inputBase =
  "w-full bg-white placeholder:text-gray-500 text-gray-700 text-sm border border-slate-200 rounded-md px-3 py-2 transition duration-300 ease focus:outline-none focus:border-slate-400 hover:border-slate-300 shadow-sm focus:shadow";

export function RegisterForm() {
  const { t } = useT("connexion");
  const router = useRouter();
  const pathname = usePathname();
  const prefix = localePrefixFromPathname(pathname);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? t("registerForm.errorRegister"));
        return;
      }

      setStatus("success");
      setMessage(data.message ?? t("registerForm.successRegister"));
      // After a successful registration, take the user to the login page.
      router.replace(`${prefix}/login`);
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
        <label htmlFor="register-name" className="block text-sm font-medium text-white mb-1">
          {t("registerForm.nameLabel")}
        </label>
        <input
          id="register-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputBase}
          placeholder={t("registerForm.namePlaceholder")}
          required
          autoComplete="name"
          disabled={status === "loading"}
        />
      </div>
      <div>
        <label htmlFor="register-email" className="block text-sm font-medium text-white mb-1">
          {t("registerForm.emailLabel")}
        </label>
        <input
          id="register-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputBase}
          placeholder={t("registerForm.emailPlaceholder")}
          required
          autoComplete="email"
          disabled={status === "loading"}
        />
      </div>
      <div>
        <label htmlFor="register-password" className="block text-sm font-medium text-white mb-1">
          {t("registerForm.passwordLabel")}
        </label>
        <input
          id="register-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputBase}
          placeholder={t("registerForm.passwordPlaceholder")}
          required
          minLength={8}
          autoComplete="new-password"
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
        {status === "loading" ? t("registerForm.submitting") : t("registerForm.submit")}
      </button>

      <p className="text-sm text-white/80">
        {t("registerForm.haveAccount")}{" "}
        <Link
          href={`${prefix}/login`}
          className="underline hover:text-white focus:outline-none focus:ring-2 focus:ring-white rounded"
        >
          {t("registerForm.loginLink")}
        </Link>
      </p>
    </form>
  );
}
