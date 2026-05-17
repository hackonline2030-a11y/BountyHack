import type { Metadata } from "next";
import { getT } from "next-i18next/server";
import { notFound } from "next/navigation";
import { Section } from "@modules/app/nextjs/components/sections/Section";
import { ReportDraftFinalValidationBootstrap } from "@modules/report-draft/react/pages/ReportDraftFinalValidationBootstrap";
import { verifySessionForRoles } from "@/lib/dal/session";
import { AppRoleCode } from "@/lib/app-role-code";
import { isSupportedLanguage } from "@modules/auth/core/model/locale.policy";

type PageProps = { params: Promise<{ lng: string; draftId: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lng } = await params;
  const { t } = await getT("reportDraft", { lng });
  return { title: t("reportDraft.finalValidation.detail.metaTitle") };
}

export default async function FinalValidationDraftPage({ params }: PageProps) {
  const { lng, draftId } = await params;
  if (!isSupportedLanguage(lng)) {
    notFound();
  }
  await verifySessionForRoles(lng, [AppRoleCode.SUPER_ADMIN]);

  const teamsHref = `/${lng}/administration/team-management`;

  return (
    <main className="flex w-full min-h-[calc(100vh-(var(--header-height)+var(--footer-height)))] flex-col">
      <Section
        fluid
        classNames="flex min-h-0 flex-1 flex-col items-center justify-start bg-pattern py-6 sm:py-10"
      >
        <ReportDraftFinalValidationBootstrap
          draftId={draftId}
          teamsHref={teamsHref}
          lng={lng}
        />
      </Section>
    </main>
  );
}
