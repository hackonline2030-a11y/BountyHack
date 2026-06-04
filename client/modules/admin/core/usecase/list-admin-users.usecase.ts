import { AppRoleCode, APP_ROLE_CODE_VALUES } from "@/lib/app-role-code";
import type { IAdminUsersGateway } from "../gateway/admin-users.gateway";
import type {
  AdminUserAccountStatus,
  AdminUserSummary,
  ListAdminUsersResult,
} from "../model/admin-users.domain-model";

const ACCOUNT_STATUS_VALUES = ["valid", "pending", "unvalid"] as const;

export type ListAdminUsersDependencies = {
  gateway: IAdminUsersGateway;
};

export type ListAdminUsersInput = {
  /** Verified raw access JWT, ready for upstream `Authorization: Bearer`. */
  token: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readNullableString(record: Record<string, unknown>, key: string): string | null {
  const raw = record[key];
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed || null;
}

function readRoleCode(record: Record<string, unknown>): AppRoleCode | null {
  const raw = record["roleCode"];
  if (typeof raw !== "string") return null;
  return (APP_ROLE_CODE_VALUES as readonly string[]).includes(raw)
    ? (raw as AppRoleCode)
    : null;
}

function readAccountStatus(record: Record<string, unknown>): AdminUserAccountStatus {
  const raw = record["accountStatus"];
  if (
    typeof raw === "string" &&
    (ACCOUNT_STATUS_VALUES as readonly string[]).includes(raw)
  ) {
    return raw as AdminUserAccountStatus;
  }
  return "valid";
}

function parseSummary(raw: unknown): AdminUserSummary | null {
  if (!isRecord(raw)) return null;
  const uid = readNullableString(raw, "uid");
  const username = readNullableString(raw, "username");
  if (!uid || !username) return null;
  return {
    uid,
    username,
    email: readNullableString(raw, "email"),
    roleCode: readRoleCode(raw),
    accountStatus: readAccountStatus(raw),
  };
}

/**
 * Pure use case: takes a verified bearer token, returns the parsed list (or a
 * typed failure). Knows nothing about cookies, Next routing, or React.
 *
 * Defence in depth lives at three layers around this function:
 *  1. Next page gate (`verifySessionForRoles([SUPER_ADMIN])`) — UX 404 for non-admins.
 *  2. Nest controller decorator (`@AuthRoles(SUPER_ADMIN)`) — authoritative.
 *  3. Domain parsing here — unknown role codes coerced to `null`, unexpected
 *     payload shape surfaces `malformed_payload` instead of leaking raw values
 *     to the UI.
 */
export async function listAdminUsersUseCase(
  input: ListAdminUsersInput,
  deps: ListAdminUsersDependencies,
): Promise<ListAdminUsersResult> {
  let res: Response;
  try {
    res = await deps.gateway.list(input.token);
  } catch {
    return { ok: false, reason: "unreachable" };
  }

  if (res.status === 401) {
    return { ok: false, reason: "unauthorized" };
  }
  if (!res.ok) {
    return { ok: false, reason: "unreachable" };
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    return { ok: false, reason: "malformed_payload" };
  }

  if (!isRecord(data) || !Array.isArray(data["items"])) {
    return { ok: false, reason: "malformed_payload" };
  }

  const items = data["items"]
    .map(parseSummary)
    .filter((entry): entry is AdminUserSummary => entry !== null);
  return { ok: true, items };
}
