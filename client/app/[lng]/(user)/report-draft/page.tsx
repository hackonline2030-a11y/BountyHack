import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Section } from "@modules/app/nextjs/components/sections/Section";
import { verifySession } from "@/lib/dal/session";
import { isSupportedLanguage } from "@modules/auth/core/model/locale.policy";
import { ReportDraftWizardPage } from "@modules/report-draft/react/pages/ReportDraftWizardPage";

type PageProps = { params: Promise<{ lng: string }> };

export async function generateMetadata(_props: PageProps): Promise<Metadata> {
  return { title: "Rapport — brouillon (démo)" };
}

export default async function ReportDraftPage({ params }: PageProps) {
  const { lng } = await params;
  if (!isSupportedLanguage(lng)) {
    notFound();
  }
  await verifySession(lng);

  return (
    <main className="flex w-full min-h-[calc(100vh-(var(--header-height)+var(--footer-height)))] flex-col">
      <Section
        fluid
        classNames="flex min-h-0 flex-1 flex-col items-center justify-center bg-pattern"
      >
        <ReportDraftWizardPage />
      </Section>
    </main>
  );
}
