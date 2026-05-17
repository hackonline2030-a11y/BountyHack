import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AppRoleCode } from "@/lib/app-role-code";
import { verifySessionForRoles } from "@/lib/dal/session";
import { isSupportedLanguage } from "@modules/auth/core/model/locale.policy";
import { Section } from "@modules/app/nextjs/components/sections/Section";
import { QualityCheckerSubmissionsPage } from "@modules/report-draft/react/pages/QualityCheckerSubmissionsPage";

type PageProps = {
  params: Promise<{ lng: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Soumissions à revoir" };
}

export default async function QcSubmissionsListPage({ params }: PageProps) {
  const { lng } = await params;
  if (!isSupportedLanguage(lng)) {
    notFound();
  }
  await verifySessionForRoles(lng, [AppRoleCode.QUALITY_CHECKER]);

  return (
    <main className="flex w-full min-h-[calc(100vh-(var(--header-height)+var(--footer-height)))] flex-col">
      <Section fluid classNames="flex min-h-0 flex-1 flex-col bg-pattern py-6">
        <Suspense fallback={<p className="p-6 text-sm text-dashboard-text-muted">Chargement…</p>}>
          <QualityCheckerSubmissionsPage lng={lng} />
        </Suspense>
      </Section>
    </main>
  );
}
