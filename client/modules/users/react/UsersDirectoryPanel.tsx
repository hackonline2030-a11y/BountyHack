"use client";

import { useMemo, useState } from "react";
import { useT } from "next-i18next/client";

export type UsersDirectoryPanelEntry = {
  uid: string;
  username: string;
  roleCode: string | null;
};

type UsersDirectoryPanelProps = {
  initialUsers: UsersDirectoryPanelEntry[];
  loadError?: boolean;
};

export function UsersDirectoryPanel({
  initialUsers,
  loadError = false,
}: UsersDirectoryPanelProps) {
  const { t } = useT("users");
  const [query, setQuery] = useState("");

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return initialUsers;
    return initialUsers.filter((user) =>
      `${user.username} ${user.roleCode ?? ""}`
        .toLocaleLowerCase()
        .includes(normalizedQuery),
    );
  }, [initialUsers, query]);

  if (loadError) {
    return (
      <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {t("loadError")}
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-4" aria-labelledby="users-directory-heading">
      <header>
        <h1 id="users-directory-heading" className="text-2xl font-bold tracking-tight text-slate-900">
          {t("pageTitle")}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{t("description")}</p>
      </header>

      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
        {t("searchLabel")}
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("searchPlaceholder")}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none ring-blue-500 focus:ring-2"
        />
      </label>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="max-h-[32rem] overflow-y-auto">
          {filteredUsers.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500">{t("empty")}</p>
          ) : (
            <ul className="divide-y divide-slate-200" role="list">
              {filteredUsers.map((user) => (
                <li key={user.uid} className="flex items-center justify-between gap-4 px-4 py-3">
                  <span className="min-w-0 truncate font-medium text-slate-900">{user.username}</span>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {user.roleCode ? t(`roles.${user.roleCode}`, { defaultValue: user.roleCode }) : t("noRole")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <p className="text-xs text-slate-500">{t("count", { n: filteredUsers.length })}</p>
    </section>
  );
}
