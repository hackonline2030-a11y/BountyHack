import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppRoleCode } from "@/lib/app-role-code";
import { verifySessionForRoles } from "@/lib/dal/session";
import { isSupportedLanguage } from "@modules/auth/core/model/locale.policy";
import { Section } from "@modules/app/nextjs/components/sections/Section";
import { GlobalSubmissionReviewBootstrap } from "@modules/report-draft/react/pages/GlobalSubmissionReviewBootstrap";

type PageProps = {
  params: Promise<{ lng: string; globalSubmissionId: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Revue globale — soumission hunter" };
}

export default async function QcGlobalSubmissionReviewPage({ params }: PageProps) {
  const { lng, globalSubmissionId } = await params;
  if (!isSupportedLanguage(lng)) {
    notFound();
  }
  await verifySessionForRoles(lng, [AppRoleCode.QUALITY_CHECKER]);

  return (
    <main className="flex w-full min-h-[calc(100vh-(var(--header-height)+var(--footer-height)))] flex-col">
      <Section fluid classNames="flex min-h-0 flex-1 flex-col bg-pattern py-6">
        <GlobalSubmissionReviewBootstrap
          globalSubmissionId={globalSubmissionId}
          lng={lng}
          backHref={`/${lng}/submissions`}
          isSuperAdmin={false}
        />
      </Section>
    </main>
  );
}
