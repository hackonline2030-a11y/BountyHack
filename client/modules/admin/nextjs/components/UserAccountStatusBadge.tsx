import type { AdminUserAccountStatus } from "@modules/admin/core/model/admin-users.domain-model";

type Props = {
  status: AdminUserAccountStatus;
  label: string;
};

const statusClass: Record<AdminUserAccountStatus, string> = {
  valid: "bg-emerald-100 text-emerald-900 border-emerald-200",
  pending: "bg-amber-100 text-amber-950 border-amber-200",
  unvalid: "bg-rose-100 text-rose-900 border-rose-200",
};

export function UserAccountStatusBadge({ status, label }: Props) {
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${statusClass[status]}`}
    >
      {label}
    </span>
  );
}
