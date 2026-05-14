import { getT } from "next-i18next/server";
import type { AdminUserSummary } from "@modules/admin/core/model/admin-users.domain-model";

type UserManagementTableProps = {
  lng: string;
  users: readonly AdminUserSummary[];
};

/**
 * Admin-only users table. Server Component on purpose:
 *  - no client state (the listing is read-only for now);
 *  - the data is already produced server-side by `listAdminUsers`, so we avoid
 *    shipping the user payload through React-on-the-client and the matching
 *    JS bundle;
 *  - the JWT cookie never reaches client JS — the table only ever sees the
 *    sanitised summary (uid / username / email / roleCode), never tokens.
 *
 * Future client-side affordances (filter input, role edit, deletion) can be
 * extracted into a `"use client"` child wired here without leaking auth state.
 */
export async function UserManagementTable({ lng, users }: UserManagementTableProps) {
  const { t } = await getT(["administration", "common"], { lng });

  if (users.length === 0) {
    return (
      <p className="text-sm text-white/80" role="status">
        {t("userManagementTable.empty")}
      </p>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-md border border-white/10 bg-white/5">
      <table className="w-full min-w-[480px] text-left text-sm text-white">
        <caption className="sr-only">
          {t("userManagementTable.caption")}
        </caption>
        <thead className="bg-white/10 text-xs uppercase tracking-wide text-white/80">
          <tr>
            <th scope="col" className="px-4 py-2 font-semibold">
              {t("userManagementTable.columns.username")}
            </th>
            <th scope="col" className="px-4 py-2 font-semibold">
              {t("userManagementTable.columns.email")}
            </th>
            <th scope="col" className="px-4 py-2 font-semibold">
              {t("userManagementTable.columns.role")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {users.map((user) => (
            <tr key={user.uid} className="hover:bg-white/5">
              <td className="px-4 py-2">{user.username}</td>
              <td className="px-4 py-2">
                {user.email ?? (
                  <span className="text-white/50">
                    {t("userManagementTable.values.noEmail")}
                  </span>
                )}
              </td>
              <td className="px-4 py-2">
                {user.roleCode ? (
                  t(`userManagementTable.roles.${user.roleCode}`)
                ) : (
                  <span className="text-white/50">
                    {t("userManagementTable.values.noRole")}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
