import type { Metadata } from "next";
import { getT } from "next-i18next/server";
import { notFound } from "next/navigation";
import { verifySession, verifySessionForRoles } from "@/lib/dal/session";
import { AppRoleCode } from "@/lib/app-role-code";
import { isSupportedLanguage } from "@modules/auth/core/model/locale.policy";
import type { ReportTeamMemberRole } from "@modules/report-team/model/report-team.types";
import { ReportTeamsMemberBootstrap } from "@modules/report-team/react/ReportTeamsMemberBootstrap";

type Config = {
  allowedRoles: AppRoleCode[];
  defaultRole: ReportTeamMemberRole;
  roleOptions: ReadonlyArray<ReportTeamMemberRole>;
  welcomePath: string;
};

export function createMemberTeamsPage(config: Config) {
  async function generateMetadata({
    params,
  }: {
    params: Promise<{ lng: string }>;
  }): Promise<Metadata> {
    const { lng } = await params;
    const { t } = await getT("reportTeams", { lng });
    return { title: t("reportTeams.metaTitle") };
  }

  async function Page({ params }: { params: Promise<{ lng: string }> }) {
    const { lng } = await params;
    if (!isSupportedLanguage(lng)) notFound();
    await verifySessionForRoles(lng, config.allowedRoles);
    const payload = await verifySession(lng);
    const currentUserId = payload.sub?.trim();
    if (!currentUserId) {
      notFound();
    }

    return (
      <ReportTeamsMemberBootstrap
        lng={lng}
        currentUserId={currentUserId}
        welcomePath={config.welcomePath}
        defaultRole={config.defaultRole}
        roleOptions={config.roleOptions}
      />
    );
  }

  return { generateMetadata, default: Page };
}
