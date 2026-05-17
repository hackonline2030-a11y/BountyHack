import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppRoleCode } from "@/lib/app-role-code";
import { verifySessionForRoles } from "@/lib/dal/session";
import { isSupportedLanguage } from "@modules/auth/core/model/locale.policy";
import { Section } from "@modules/app/nextjs/components/sections/Section";
import { ReportDraftGlobalRevisionReviewBootstrap } from "@modules/report-draft/react/pages/ReportDraftGlobalRevisionReviewBootstrap";

type PageProps = {
  params: Promise<{ lng: string; draftId: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Révision globale super-admin" };
}

export default async function QcGlobalRevisionReviewPage({ params }: PageProps) {
  const { lng, draftId } = await params;
  if (!isSupportedLanguage(lng)) {
    notFound();
  }
  await verifySessionForRoles(lng, [AppRoleCode.QUALITY_CHECKER]);

  return (
    <main className="flex w-full min-h-[calc(100vh-(var(--header-height)+var(--footer-height)))] flex-col">
      <Section fluid classNames="flex min-h-0 flex-1 flex-col bg-pattern py-6">
        <ReportDraftGlobalRevisionReviewBootstrap
          draftId={draftId}
          lng={lng}
          backHref={`/${lng}/submissions`}
        />
      </Section>
    </main>
  );
}
