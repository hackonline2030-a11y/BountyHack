import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getT } from "next-i18next/server";
import { Section } from "@modules/app/nextjs/components/sections/Section";
import { verifySessionForRoles } from "@/lib/dal/session";
import { AppRoleCode } from "@/lib/app-role-code";
import { isSupportedLanguage } from "@modules/auth/core/model/locale.policy";
import { CoordinatorTeamDetailPanel } from "@modules/report-team/react/CoordinatorTeamDetailPanel";

type PageProps = { params: Promise<{ lng: string; teamId: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lng } = await params;
  const { t } = await getT("reportTeams", { lng });
  return { title: t("reportTeams.coordinator.teamDetail.metaTitle") };
}

export default async function CoordinatorTeamDetailPage({ params }: PageProps) {
  const { lng, teamId } = await params;
  if (!isSupportedLanguage(lng)) notFound();
  await verifySessionForRoles(lng, [AppRoleCode.COORDINATOR]);

  if (!teamId?.trim()) notFound();

  return (
    <main className="flex w-full min-h-[calc(100vh-(var(--header-height)+var(--footer-height)))] flex-col">
      <Section
        fluid
        classNames="bg-pattern flex flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
      >
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
          <div className="dashboard-card flex flex-col gap-6 p-5 sm:p-6">
            <CoordinatorTeamDetailPanel teamId={teamId.trim()} />
          </div>
        </div>
      </Section>
    </main>
  );
}
