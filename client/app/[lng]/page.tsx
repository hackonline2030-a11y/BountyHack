import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createRequireAppSessionDependencies } from "@modules/auth/core/auth.factory";
import { requireAppSessionUseCase } from "@modules/auth/core/usecase/require-app-session.usecase";
import { ACCESS_TOKEN_COOKIE_NAME } from "@modules/auth/core/model/session.constants";
import { AppRoleCode } from "@/lib/app-role-code";
import { nestInternalApiUrl } from "@/lib/server/nest-internal-url";

type PageProps = {
  params: Promise<{ lng: string }>;
};

/** Single place: locale root → role dashboard (existing welcome-* pages). */
const DASHBOARD_BY_ROLE: Partial<Record<AppRoleCode, string>> = {
  [AppRoleCode.SUPER_ADMIN]: "welcome-admin",
  [AppRoleCode.HUNTER]: "welcome-hunter",
  [AppRoleCode.QUALITY_CHECKER]: "welcome-quality-checker",
  [AppRoleCode.MENTOR]: "welcome-mentor",
  [AppRoleCode.COORDINATOR]: "welcome-coordinator",
  [AppRoleCode.QUALITY_CONTENT]: "welcome-platform-manager",
};

export default async function Home({ params }: PageProps) {
  const { lng } = await params;
  const login = `/${lng}/login`;

  const session = await requireAppSessionUseCase(
    createRequireAppSessionDependencies(),
  );
  if (!session.ok) {
    redirect(login);
  }

  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE_NAME)?.value?.trim();
  if (!token) {
    redirect(login);
  }

  const res = await fetch(nestInternalApiUrl("users/me"), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) {
    redirect(login);
  }

  const data: unknown = await res.json().catch(() => null);
  const roleCode =
    data && typeof data === "object"
      ? (data as Record<string, unknown>).roleCode
      : null;
  const segment =
    typeof roleCode === "string"
      ? DASHBOARD_BY_ROLE[roleCode as AppRoleCode]
      : undefined;

  redirect(segment ? `/${lng}/${segment}` : login);
}
