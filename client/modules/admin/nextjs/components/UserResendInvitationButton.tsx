"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useT } from "next-i18next/client";
import { MailIcon } from "@modules/admin/nextjs/icons";
import { ConfirmDangerModal } from "@modules/app/nextjs/components/ConfirmDangerModal";

type Props = {
  userId: string;
  username: string;
  locale: string;
};

export function UserResendInvitationButton({ userId, username, locale }: Props) {
  const { t } = useT(["administration", "common"]);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function performResend() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/users/${encodeURIComponent(userId)}/resend-invitation`,
        {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locale }),
        },
      );
      if (!res.ok) {
        let message = t("administration:userManagementTable.resendFailed");
        try {
          const body: unknown = await res.json();
          if (
            body &&
            typeof body === "object" &&
            typeof (body as { message?: unknown }).message === "string"
          ) {
            message = (body as { message: string }).message;
          }
        } catch {
          /* keep default */
        }
        setError(message);
        setConfirmOpen(false);
        return;
      }
      setConfirmOpen(false);
      router.refresh();
    } catch {
      setError(t("administration:userManagementTable.resendFailed"));
      setConfirmOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        className="inline-flex cursor-pointer items-center justify-center rounded-md border border-sky-200 bg-white p-2 text-sky-800 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => setConfirmOpen(true)}
        disabled={busy}
        aria-label={t("administration:userManagementTable.resendAria", { username })}
        title={t("administration:userManagementTable.resendTooltip")}
      >
        <MailIcon className="size-4" />
      </button>
      {error ? (
        <p role="alert" className="max-w-[12rem] text-right text-xs text-rose-700">
          {error}
        </p>
      ) : null}

      <ConfirmDangerModal
        open={confirmOpen}
        title={t("administration:userManagementTable.resendConfirmTitle")}
        cancelLabel={t("common:confirmModal.cancel")}
        confirmLabel={t("administration:userManagementTable.resendConfirmAction")}
        confirming={busy}
        confirmingLabel={t("common:confirmModal.confirming")}
        onCancel={() => {
          if (!busy) setConfirmOpen(false);
        }}
        onConfirm={() => void performResend()}
      >
        {t("administration:userManagementTable.resendConfirm", { username })}
      </ConfirmDangerModal>
    </div>
  );
}
