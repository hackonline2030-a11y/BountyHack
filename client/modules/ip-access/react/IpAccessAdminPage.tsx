"use client";

import Link from "next/link";
import { type FC, FormEvent, useCallback, useEffect, useState } from "react";
import { useT } from "next-i18next/client";
import { fetchBff } from "@/lib/bff-fetch";
import { readFriendlyHttpError } from "@/lib/http-error-message";
import { PrimaryButton } from "@modules/app/nextjs/components/buttons/PrimaryButton";
import { ConfirmDangerModal } from "@modules/app/nextjs/components/ConfirmDangerModal";
import { IconActionButton } from "@modules/app/nextjs/components/buttons/IconActionButton";
import { TrashIcon } from "@modules/report-team/react/icons";

export type IpBlacklistRow = {
  clientIp: string;
  reason: string;
  blacklistedAt: string;
};

export type IpCidrEntryRow = {
  id: string;
  cidr: string;
  label: string | null;
  createdAt: string;
  createdByUserId: string;
};

type WhitelistPayload = {
  settings: {
    ipWhitelistEnabled: boolean;
    updatedAt: string;
    updatedByUserId: string | null;
  };
  entries: IpCidrEntryRow[];
};

type Props = {
  lng: string;
};

type DeleteTarget = { entryId: string; cidr: string };

function formatDateTime(iso: string, lng: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat(lng === "fr" ? "fr-FR" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export const IpAccessAdminPage: FC<Props> = ({ lng }) => {
  const { t } = useT(["ipAccess", "common"]);
  const [blacklist, setBlacklist] = useState<IpBlacklistRow[]>([]);
  const [reallow, setReallow] = useState<IpCidrEntryRow[]>([]);
  const [whitelistEnabled, setWhitelistEnabled] = useState(false);
  const [whitelist, setWhitelist] = useState<IpCidrEntryRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [busy, setBusy] = useState(false);
  const [whitelistCidrInput, setWhitelistCidrInput] = useState("");
  const [whitelistLabelInput, setWhitelistLabelInput] = useState("");

  const load = useCallback(async () => {
    setLoadError(null);
    const [blacklistRes, reallowRes, whitelistRes] = await Promise.all([
      fetchBff("/api/ip-access/blacklist", { credentials: "include", cache: "no-store" }),
      fetchBff("/api/ip-access/reallow", { credentials: "include", cache: "no-store" }),
      fetchBff("/api/ip-access/whitelist", { credentials: "include", cache: "no-store" }),
    ]);

    if (!blacklistRes.ok || !reallowRes.ok || !whitelistRes.ok) {
      const failed = !blacklistRes.ok ? blacklistRes : !reallowRes.ok ? reallowRes : whitelistRes;
      setLoadError(await readFriendlyHttpError(failed, t("ipAccess:loadFailed")));
      return;
    }

    const blacklistData = (await blacklistRes.json()) as IpBlacklistRow[];
    const reallowData = (await reallowRes.json()) as IpCidrEntryRow[];
    const whitelistData = (await whitelistRes.json()) as WhitelistPayload;
    setBlacklist(Array.isArray(blacklistData) ? blacklistData : []);
    setReallow(Array.isArray(reallowData) ? reallowData : []);
    setWhitelistEnabled(Boolean(whitelistData.settings?.ipWhitelistEnabled));
    setWhitelist(Array.isArray(whitelistData.entries) ? whitelistData.entries : []);
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const onToggleWhitelist = async () => {
    setActionError(null);
    setBusy(true);
    try {
      const res = await fetchBff("/api/ip-access/whitelist/enabled", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !whitelistEnabled }),
      });
      if (!res.ok) {
        throw new Error(await readFriendlyHttpError(res, t("ipAccess:whitelist.toggleFailed")));
      }
      const data = (await res.json()) as WhitelistPayload["settings"];
      setWhitelistEnabled(Boolean(data.ipWhitelistEnabled));
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : t("ipAccess:whitelist.toggleFailed"),
      );
    } finally {
      setBusy(false);
    }
  };

  const onAddWhitelist = async (event: FormEvent) => {
    event.preventDefault();
    const cidr = whitelistCidrInput.trim();
    if (!cidr) {
      return;
    }
    setActionError(null);
    setBusy(true);
    try {
      const res = await fetchBff("/api/ip-access/whitelist", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cidr,
          label: whitelistLabelInput.trim() || undefined,
        }),
      });
      if (!res.ok) {
        throw new Error(await readFriendlyHttpError(res, t("ipAccess:whitelist.addFailed")));
      }
      const created = (await res.json()) as IpCidrEntryRow;
      setWhitelist((current) =>
        [...current, created].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      );
      setWhitelistCidrInput("");
      setWhitelistLabelInput("");
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : t("ipAccess:whitelist.addFailed"),
      );
    } finally {
      setBusy(false);
    }
  };

  const onConfirmDeleteWhitelist = async () => {
    if (!deleteTarget) {
      return;
    }
    setActionError(null);
    setBusy(true);
    try {
      const res = await fetchBff(
        `/api/ip-access/whitelist/${encodeURIComponent(deleteTarget.entryId)}`,
        { method: "DELETE", credentials: "include" },
      );
      if (!res.ok) {
        throw new Error(await readFriendlyHttpError(res, t("ipAccess:actionFailed")));
      }
      setWhitelist((current) => current.filter((row) => row.id !== deleteTarget.entryId));
      setDeleteTarget(null);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : t("ipAccess:actionFailed"),
      );
      setDeleteTarget(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="flex w-full max-w-6xl flex-col gap-6">
      <header className="dashboard-card px-6 py-6">
        <Link
          href={`/${lng}/welcome-admin`}
          className="text-sm text-dashboard-accent hover:underline"
        >
          {t("ipAccess:backLink")}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-dashboard-text">
          {t("ipAccess:title")}
        </h1>
        <p className="mt-1 text-sm text-dashboard-text-muted">
          {t("ipAccess:subtitle")}
        </p>
        <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
          {t("ipAccess:devNotice")}
        </p>
      </header>

      {loadError ? (
        <p
          role="alert"
          className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900"
        >
          {loadError}
        </p>
      ) : null}

      {actionError ? (
        <p
          role="alert"
          className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900"
        >
          {actionError}
        </p>
      ) : null}

      <section className="dashboard-card overflow-x-auto">
        <div className="border-b border-dashboard-divider px-6 py-4">
          <h2 className="text-lg font-semibold text-dashboard-text">
            {t("ipAccess:blacklist.title")}
          </h2>
          <p className="mt-1 text-sm text-dashboard-text-muted">
            {t("ipAccess:blacklist.description")}
          </p>
        </div>
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-dashboard-divider bg-dashboard-surface text-xs uppercase text-dashboard-text-muted">
            <tr>
              <th className="px-4 py-3">{t("ipAccess:blacklist.columns.ip")}</th>
              <th className="px-4 py-3">{t("ipAccess:blacklist.columns.reason")}</th>
              <th className="px-4 py-3">{t("ipAccess:blacklist.columns.blacklistedAt")}</th>
            </tr>
          </thead>
          <tbody>
            {blacklist.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-dashboard-text-muted">
                  {t("ipAccess:emptyBlacklist")}
                </td>
              </tr>
            ) : (
              blacklist.map((row) => (
                <tr key={row.clientIp} className="border-b border-dashboard-divider">
                  <td className="px-4 py-3 font-mono text-dashboard-text">{row.clientIp}</td>
                  <td className="px-4 py-3 text-dashboard-text-muted">{row.reason}</td>
                  <td className="px-4 py-3 text-dashboard-text-muted">
                    {formatDateTime(row.blacklistedAt, lng)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <section className="dashboard-card flex flex-col gap-4 px-6 py-6">
        <div>
          <h2 className="text-lg font-semibold text-dashboard-text">
            {t("ipAccess:reallow.title")}
          </h2>
          <p className="mt-1 text-sm text-dashboard-text-muted">
            {t("ipAccess:reallow.description")}
          </p>
          <p className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800">
            {t("ipAccess:reallow.oralOnlyNotice")}
          </p>
        </div>

        <div className="overflow-x-auto border-t border-dashboard-divider pt-4">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-dashboard-divider bg-dashboard-surface text-xs uppercase text-dashboard-text-muted">
              <tr>
                <th className="px-4 py-3">{t("ipAccess:reallow.columns.cidr")}</th>
                <th className="px-4 py-3">{t("ipAccess:reallow.columns.label")}</th>
                <th className="px-4 py-3">{t("ipAccess:reallow.columns.createdAt")}</th>
              </tr>
            </thead>
            <tbody>
              {reallow.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-dashboard-text-muted">
                    {t("ipAccess:emptyReallow")}
                  </td>
                </tr>
              ) : (
                reallow.map((row) => (
                  <tr key={row.id} className="border-b border-dashboard-divider">
                    <td className="px-4 py-3 font-mono text-dashboard-text">{row.cidr}</td>
                    <td className="px-4 py-3 text-dashboard-text-muted">
                      {row.label ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-dashboard-text-muted">
                      {formatDateTime(row.createdAt, lng)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="dashboard-card flex flex-col gap-6 px-6 py-6">
        <div>
          <h2 className="text-lg font-semibold text-dashboard-text">
            {t("ipAccess:whitelist.title")}
          </h2>
          <p className="mt-1 text-sm text-dashboard-text-muted">
            {t("ipAccess:whitelist.description")}
          </p>
          <label className="mt-4 flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              className="size-4 rounded border-dashboard-divider"
              checked={whitelistEnabled}
              disabled={busy}
              onChange={() => void onToggleWhitelist()}
            />
            <span className="text-sm text-dashboard-text">
              {whitelistEnabled
                ? t("ipAccess:whitelist.enabledLabel")
                : t("ipAccess:whitelist.disabledLabel")}
            </span>
          </label>
        </div>

        <form
          onSubmit={(event) => void onAddWhitelist(event)}
          className="grid gap-4 border-t border-dashboard-divider pt-6 sm:grid-cols-2"
        >
          <h3 className="sm:col-span-2 text-base font-medium text-dashboard-text">
            {t("ipAccess:whitelist.addTitle")}
          </h3>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-dashboard-text-muted">
              {t("ipAccess:whitelist.cidrLabel")}
            </span>
            <input
              type="text"
              value={whitelistCidrInput}
              onChange={(event) => setWhitelistCidrInput(event.target.value)}
              placeholder={t("ipAccess:whitelist.cidrPlaceholder")}
              className="rounded-md border border-dashboard-divider bg-dashboard-surface px-3 py-2 font-mono text-dashboard-text"
              disabled={busy}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-dashboard-text-muted">
              {t("ipAccess:whitelist.labelLabel")}
            </span>
            <input
              type="text"
              value={whitelistLabelInput}
              onChange={(event) => setWhitelistLabelInput(event.target.value)}
              placeholder={t("ipAccess:whitelist.labelPlaceholder")}
              className="rounded-md border border-dashboard-divider bg-dashboard-surface px-3 py-2 text-dashboard-text"
              disabled={busy}
            />
          </label>
          <div className="sm:col-span-2">
            <PrimaryButton type="submit" disabled={busy || !whitelistCidrInput.trim()}>
              {t("ipAccess:whitelist.addButton")}
            </PrimaryButton>
          </div>
        </form>

        <div className="overflow-x-auto border-t border-dashboard-divider pt-6">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-dashboard-divider bg-dashboard-surface text-xs uppercase text-dashboard-text-muted">
              <tr>
                <th className="px-4 py-3">{t("ipAccess:whitelist.columns.cidr")}</th>
                <th className="px-4 py-3">{t("ipAccess:whitelist.columns.label")}</th>
                <th className="px-4 py-3">{t("ipAccess:whitelist.columns.createdAt")}</th>
                <th className="px-4 py-3">{t("ipAccess:whitelist.columns.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {whitelist.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-dashboard-text-muted">
                    {t("ipAccess:emptyWhitelist")}
                  </td>
                </tr>
              ) : (
                whitelist.map((row) => (
                  <tr key={row.id} className="border-b border-dashboard-divider">
                    <td className="px-4 py-3 font-mono text-dashboard-text">{row.cidr}</td>
                    <td className="px-4 py-3 text-dashboard-text-muted">
                      {row.label ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-dashboard-text-muted">
                      {formatDateTime(row.createdAt, lng)}
                    </td>
                    <td className="px-4 py-3">
                      <IconActionButton
                        label={t("ipAccess:whitelist.remove")}
                        onClick={() =>
                          setDeleteTarget({ entryId: row.id, cidr: row.cidr })
                        }
                        disabled={busy}
                      >
                        <TrashIcon className="size-4" />
                      </IconActionButton>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <ConfirmDangerModal
        open={deleteTarget !== null}
        title={t("ipAccess:whitelist.removeConfirmTitle")}
        cancelLabel={t("common:confirmModal.cancel")}
        confirmLabel={t("ipAccess:whitelist.confirmRemove")}
        confirming={busy}
        confirmingLabel={t("common:confirmModal.confirming")}
        onConfirm={() => void onConfirmDeleteWhitelist()}
        onCancel={() => {
          if (!busy) {
            setDeleteTarget(null);
          }
        }}
      >
        {deleteTarget
          ? t("ipAccess:whitelist.removeConfirmBody", { cidr: deleteTarget.cidr })
          : null}
      </ConfirmDangerModal>
    </article>
  );
};
