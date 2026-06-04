"use client";

import { ActionButton } from "@modules/app/nextjs/components/buttons/ActionButton";
import { FakeUserSetupLinkModal } from "@modules/admin/nextjs/components/FakeUserSetupLinkModal";

import { useState, type SyntheticEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useT } from "next-i18next/client";
import { localePrefixFromPathname } from "@/lib/locale-path";
import {
  messageFromNestBody,
  postAuthRegister,
  type NestAuthRegisterInvitationResponse,
} from "@/lib/auth-api";
import {
  AppRoleCode,
  REGISTER_ROLE_OPTIONS,
} from "@/lib/app-role-code";

const inputBase =
  "w-full bg-white placeholder:text-gray-500 text-gray-700 text-sm border border-slate-200 rounded-md px-3 py-2 transition duration-300 ease focus:outline-none focus:border-slate-400 hover:border-slate-300 shadow-sm focus:shadow";

function isFakeUserRegisterResponse(
  data: unknown,
): data is NestAuthRegisterInvitationResponse & { accountSetupLink: string } {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as NestAuthRegisterInvitationResponse).fakeUser === true &&
    typeof (data as NestAuthRegisterInvitationResponse).accountSetupLink === "string" &&
    (data as NestAuthRegisterInvitationResponse).accountSetupLink.length > 0
  );
}

export function RegisterForm() {
  const { t } = useT(["register", "common"]);
  const router = useRouter();
  const pathname = usePathname();
  const prefix = localePrefixFromPathname(pathname);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [roleCode, setRoleCode] = useState<AppRoleCode>(AppRoleCode.HUNTER);
  const [fakeUser, setFakeUser] = useState(false);
  const locale = prefix.replace(/^\//, "");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [setupLink, setSetupLink] = useState("");
  const [createdUsername, setCreatedUsername] = useState("");
  const [createdEmail, setCreatedEmail] = useState("");

  function closeSetupModalAndGoToAdmin() {
    setSetupModalOpen(false);
    setSetupLink("");
    router.replace(`${prefix}/administration`);
    router.refresh();
  }

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await postAuthRegister({
        username,
        email,
        roleCode,
        locale,
        fakeUser,
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

      if (isFakeUserRegisterResponse(data)) {
        setMessage(t("registerForm.successFakeUser"));
        setCreatedUsername(data.user.username);
        setCreatedEmail(data.user.email);
        setSetupLink(data.accountSetupLink);
        setSetupModalOpen(true);
        return;
      }

      setMessage(t("registerForm.successInvitation"));
      router.replace(`${prefix}/administration`);
      router.refresh();
    } catch {
      setStatus("error");
      setMessage(t("common:errors.network"));
    }
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 w-full max-w-sm"
        noValidate
      >
        <div>
          <label htmlFor="register-role" className="mb-1 block text-sm font-medium text-form-text">
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
          <label htmlFor="register-username" className="mb-1 block text-sm font-medium text-form-text">
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
          <label htmlFor="register-email" className="mb-1 block text-sm font-medium text-form-text">
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

        <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-form-text">{t("registerForm.fakeUserLabel")}</p>
            <p className="mt-0.5 text-xs text-slate-500">{t("registerForm.fakeUserHint")}</p>
          </div>
          <button
            type="button"
            id="register-fake-user"
            role="switch"
            aria-checked={fakeUser}
            disabled={status === "loading"}
            onClick={() => setFakeUser((v) => !v)}
            className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
              fakeUser ? "bg-violet-600" : "bg-slate-300"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow transition ${
                fakeUser ? "translate-x-7" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        <p className="text-sm text-slate-600">
          {fakeUser ? t("registerForm.fakeUserInvitationHint") : t("registerForm.invitationHint")}
        </p>

        {message && (
          <p
            role="alert"
            className={`text-sm ${status === "error" ? "text-red-700" : "text-emerald-800"}`}
          >
            {message}
          </p>
        )}

        <ActionButton type="submit" variant="primary" disabled={status === "loading"} className="w-fit">
          {status === "loading" ? t("registerForm.submitting") : t("registerForm.submit")}
        </ActionButton>
      </form>

      <FakeUserSetupLinkModal
        open={setupModalOpen}
        title={t("registerForm.fakeUserModalTitle")}
        lead={t("registerForm.fakeUserModalLead")}
        username={createdUsername}
        email={createdEmail}
        setupLink={setupLink}
        openLinkLabel={t("registerForm.fakeUserOpenLink")}
        copyLinkLabel={t("registerForm.fakeUserCopyLink")}
        copiedLabel={t("registerForm.fakeUserCopied")}
        closeLabel={t("registerForm.fakeUserModalClose")}
        onClose={closeSetupModalAndGoToAdmin}
      />
    </>
  );
}
