"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useT } from "next-i18next/client";
import { TrashIcon } from "@modules/report-team/react/icons";

type Props = {
  userId: string;
  username: string;
};

export function UserDeleteButton({ userId, username }: Props) {
  const { t } = useT("administration");
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDelete() {
    if (busy) return;
    const confirmed = window.confirm(
      t("userManagementTable.deleteConfirm", { username }),
    );
    if (!confirmed) return;

    setBusy(true);
    setError(null);

    try {
      const res = await fetch(`/api/users/${encodeURIComponent(userId)}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (!res.ok) {
        let message = t("userManagementTable.deleteFailed");
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
        return;
      }
      router.refresh();
    } catch {
      setError(t("userManagementTable.deleteFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        className="inline-flex cursor-pointer items-center justify-center rounded-md border border-rose-200 bg-white p-2 text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => void onDelete()}
        disabled={busy}
        aria-label={t("userManagementTable.deleteAria", { username })}
        title={t("userManagementTable.deleteTitle")}
      >
        <TrashIcon className="size-4" />
      </button>
      {error ? (
        <p role="alert" className="max-w-[12rem] text-right text-xs text-rose-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
