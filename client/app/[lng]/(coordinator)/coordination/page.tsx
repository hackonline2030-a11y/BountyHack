import type { Metadata } from "next";
import Link from "next/link";
import { getT } from "next-i18next/server";
import { notFound } from "next/navigation";
import { Section } from "@modules/app/nextjs/components/sections/Section";
import { verifySessionForRoles } from "@/lib/dal/session";
import { AppRoleCode } from "@/lib/app-role-code";
import { isSupportedLanguage } from "@modules/auth/core/model/locale.policy";
import { CoordinatorCoordinationPanel } from "@modules/report-team/react/CoordinatorCoordinationPanel";
import { ReportTeamMockBanner } from "@modules/report-team/react/ReportTeamMockBanner";
import type { ReportTeamMemberRole } from "@modules/report-team/model/report-team.types";

type PageProps = { params: Promise<{ lng: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lng } = await params;
  const { t } = await getT("reportTeams", { lng });
  return { title: t("reportTeams.coordinator.metaTitle") };
}

export default async function CoordinationPage({ params }: PageProps) {
  const { lng } = await params;
  if (!isSupportedLanguage(lng)) notFound();
  await verifySessionForRoles(lng, [AppRoleCode.COORDINATOR]);

  const { t } = await getT("reportTeams", { lng });
  const prefix = `/${lng}`;

  const roleLabels: Record<ReportTeamMemberRole, string> = {
    hunter: t("reportTeams.roles.hunter"),
    quality_checker: t("reportTeams.roles.quality_checker"),
    mentor: t("reportTeams.roles.mentor"),
    super_admin: t("reportTeams.roles.super_admin"),
  };

  return (
    <main className="flex w-full min-h-[calc(100vh-(var(--header-height)+var(--footer-height)))] flex-col">
      <Section
        fluid
        classNames="bg-pattern flex flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
      >
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
          <Link
            href={`${prefix}/welcome-coordinator`}
            className="dashboard-card-cta w-fit text-sm"
          >
            ← {t("reportTeams.backToDashboard")}
          </Link>
          <header>
            <h1 className="text-2xl font-bold tracking-tight text-dashboard-heading-on-pattern sm:text-3xl">
              {t("reportTeams.coordinator.heading")}
            </h1>
            <p className="mt-1 text-sm text-dashboard-subheading-on-pattern sm:text-base">
              {t("reportTeams.coordinator.subheading")}
            </p>
          </header>
          <ReportTeamMockBanner message={t("reportTeams.mockBanner")} />
          <CoordinatorCoordinationPanel
            labels={{
              pendingTitle: t("reportTeams.coordinator.pendingTitle"),
              pendingEmpty: t("reportTeams.coordinator.pendingEmpty"),
              approve: t("reportTeams.coordinator.approve"),
              reject: t("reportTeams.coordinator.reject"),
              teamsTitle: t("reportTeams.coordinator.teamsTitle"),
              createTeam: t("reportTeams.coordinator.createTeam"),
              addMember: t("reportTeams.coordinator.addMember"),
              validityValid: t("reportTeams.validity.valid"),
              validityIncomplete: t("reportTeams.validity.incomplete"),
              roleLabels,
              teamIdLabel: t("reportTeams.myTeams.teamId"),
              membersLabel: t("reportTeams.myTeams.members"),
              mockAction: t("reportTeams.coordinator.mockAction"),
            }}
          />
        </div>
      </Section>
    </main>
  );
}
