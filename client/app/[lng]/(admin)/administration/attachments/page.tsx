import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppRoleCode } from "@/lib/app-role-code";
import { verifySessionForRoles } from "@/lib/dal/session";
import { isSupportedLanguage } from "@modules/auth/core/model/locale.policy";
import { Section } from "@modules/app/nextjs/components/sections/Section";
import { AdminReportDraftAttachmentsPage } from "@modules/report-draft/react/pages/admin/AdminReportDraftAttachmentsPage";

type PageProps = { params: Promise<{ lng: string }> };

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Pièces jointes — administration" };
}

export default async function AdminAttachmentsPage({ params }: PageProps) {
  const { lng } = await params;
  if (!isSupportedLanguage(lng)) {
    notFound();
  }
  await verifySessionForRoles(lng, [AppRoleCode.SUPER_ADMIN]);

  return (
    <main className="flex w-full min-h-[calc(100vh-(var(--header-height)+var(--footer-height)))] flex-col">
      <Section
        fluid
        classNames="flex min-h-0 flex-1 flex-col items-center justify-start bg-pattern py-10"
      >
        <AdminReportDraftAttachmentsPage lng={lng} />
      </Section>
    </main>
  );
}
