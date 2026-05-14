import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppRoleCode } from "@/lib/app-role-code";
import { verifySession, verifySessionForRoles } from "@/lib/dal/session";
import { isSupportedLanguage } from "@modules/auth/core/model/locale.policy";
import { Section } from "@modules/app/nextjs/components/sections/Section";
import { ReportDraftBootstrap } from "@modules/report-draft/react/pages/ReportDraftBootstrap";

type PageProps = {
  params: Promise<{ lng: string; reportId: string }>;
};

export async function generateMetadata(_props: PageProps): Promise<Metadata> {
  return { title: "Rapport — brouillon (démo)" };
}

export default async function ReportDraftPage({ params }: PageProps) {
  const { lng, reportId } = await params;
  if (!isSupportedLanguage(lng)) {
    notFound();
  }
  await verifySessionForRoles(lng, [AppRoleCode.HUNTER]);

  /**
   * Hunter identity = JWT `sub` (string user uid, same as Nest
   * `GET /users/me`). No conversion — the domain consumes string uids.
   */
  const payload = await verifySession(lng);
  const hunterId = payload.sub?.trim();
  if (!hunterId) {
    notFound();
  }

  return (
    <main className="flex w-full min-h-[calc(100vh-(var(--header-height)+var(--footer-height)))] flex-col">
      <Section
        fluid
        classNames="flex min-h-0 flex-1 flex-col items-center justify-center bg-pattern"
      >
        <ReportDraftBootstrap reportId={reportId} hunterId={hunterId} lng={lng} />
      </Section>
    </main>
  );
}
