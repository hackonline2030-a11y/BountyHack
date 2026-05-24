import { getT } from "next-i18next/server";
import type { AdminUserSummary } from "@modules/admin/core/model/admin-users.domain-model";
import { UserAccountStatusBadge } from "@modules/admin/nextjs/components/UserAccountStatusBadge";
import { UserDeleteButton } from "@modules/admin/nextjs/components/UserDeleteButton";
import { UserForcePasswordResetButton } from "@modules/admin/nextjs/components/UserForcePasswordResetButton";
import { UserResendInvitationButton } from "@modules/admin/nextjs/components/UserResendInvitationButton";

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
      <div className="dashboard-card px-6 py-8">
        <p className="text-center text-sm text-dashboard-text-muted" role="status">
          {t("userManagementTable.empty")}
        </p>
      </div>
    );
  }

  return (
    <div className="dashboard-card w-full overflow-x-auto">
      <table className="w-full min-w-[480px] text-left text-sm text-dashboard-text">
        <caption className="sr-only">
          {t("userManagementTable.caption")}
        </caption>
        <thead className="border-b border-dashboard-card-border bg-dashboard-accent-soft/40 text-xs uppercase tracking-wide text-dashboard-text-muted">
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
            <th scope="col" className="px-4 py-2 font-semibold">
              {t("userManagementTable.columns.status")}
            </th>
            <th scope="col" className="px-4 py-2 font-semibold text-right">
              <span className="sr-only">{t("userManagementTable.columns.actions")}</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-dashboard-divider">
          {users.map((user) => (
            <tr key={user.uid} className="hover:bg-dashboard-accent-soft/30">
              <td className="px-4 py-2">{user.username}</td>
              <td className="px-4 py-2">
                {user.email ?? (
                  <span className="text-dashboard-text-subtle">
                    {t("userManagementTable.values.noEmail")}
                  </span>
                )}
              </td>
              <td className="px-4 py-2">
                {user.roleCode ? (
                  t(`userManagementTable.roles.${user.roleCode}`)
                ) : (
                  <span className="text-dashboard-text-subtle">
                    {t("userManagementTable.values.noRole")}
                  </span>
                )}
              </td>
              <td className="px-4 py-2">
                <UserAccountStatusBadge
                  status={user.accountStatus}
                  label={t(`userManagementTable.status.${user.accountStatus}`)}
                />
              </td>
              <td className="px-4 py-2 text-right">
                <div className="flex flex-wrap items-center justify-end gap-1">
                  {user.accountStatus === "unvalid" ? (
                    <UserResendInvitationButton
                      userId={user.uid}
                      username={user.username}
                      locale={lng}
                    />
                  ) : null}
                  {user.accountStatus === "valid" ? (
                    <UserForcePasswordResetButton
                      userId={user.uid}
                      username={user.username}
                      locale={lng}
                    />
                  ) : null}
                  <UserDeleteButton userId={user.uid} username={user.username} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
