"use client";

import { useState, type SyntheticEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useT } from "next-i18next/client";
import { localePrefixFromPathname } from "@/lib/locale-path";
import {
  messageFromNestBody,
  postAuthRegister,
} from "@/lib/auth-api";
import {
  AppRoleCode,
  REGISTER_ROLE_OPTIONS,
} from "@/lib/app-role-code";

const inputBase =
  "w-full bg-white placeholder:text-gray-500 text-gray-700 text-sm border border-slate-200 rounded-md px-3 py-2 transition duration-300 ease focus:outline-none focus:border-slate-400 hover:border-slate-300 shadow-sm focus:shadow";

export function RegisterForm() {
  const { t } = useT(["register", "common"]);
  const router = useRouter();
  const pathname = usePathname();
  const prefix = localePrefixFromPathname(pathname);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleCode, setRoleCode] = useState<AppRoleCode>(AppRoleCode.USER);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await postAuthRegister({
        username,
        email,
        password,
        roleCode,
      });
      let data: unknown;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        setStatus("error");
        setMessage(messageFromNestBody(data, t("registerForm.errorRegister")));
        return;
      }

      setStatus("success");
      setMessage(t("registerForm.successRegister"));
      /**
       * The admin who registered the user stays on the admin surface — landing
       * on /administration where the new row is visible in the management table.
       * `router.refresh()` re-runs the Server Component on that route so the
       * fresh user shows up without a manual reload.
       */
      router.replace(`${prefix}/administration`);
      router.refresh();
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
        <label htmlFor="register-role" className="block text-sm font-medium text-white mb-1">
          {t("registerForm.roleLabel")}
        </label>
        <select
          id="register-role"
          value={roleCode}
          onChange={(e) => setRoleCode(e.target.value as AppRoleCode)}
          className={inputBase}
          disabled={status === "loading"}
        >
          {REGISTER_ROLE_OPTIONS.map((code) => (
            <option key={code} value={code}>
              {t(`registerForm.roles.${code}`)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="register-username" className="block text-sm font-medium text-white mb-1">
          {t("registerForm.usernameLabel")}
        </label>
        <input
          id="register-username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={inputBase}
          placeholder={t("registerForm.usernamePlaceholder")}
          required
          autoComplete="username"
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
    </form>
  );
}
