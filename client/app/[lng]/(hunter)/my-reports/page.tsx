import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getT } from "next-i18next/server";
import { AppRoleCode } from "@/lib/app-role-code";
import { verifySession, verifySessionForRoles } from "@/lib/dal/session";
import { isSupportedLanguage } from "@modules/auth/core/model/locale.policy";
import { Section } from "@modules/app/nextjs/components/sections/Section";
import { MyReportsPage } from "@modules/report-draft/react/pages/MyReportsPage";

type PageProps = { params: Promise<{ lng: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lng } = await params;
  const { t } = await getT("myReports", { lng });
  return { title: t("myReports.metaTitle") };
}

export default async function MyReportsRoute({ params }: PageProps) {
  const { lng } = await params;
  if (!isSupportedLanguage(lng)) {
    notFound();
  }
  await verifySessionForRoles(lng, [AppRoleCode.HUNTER]);

  /**
   * The hunter's id lives on the JWT `sub` claim (string). The domain
   * model carries it as a `number` (PG bigint surfaced through Prisma),
   * so we convert at the boundary. A malformed sub means a broken token —
   * fall through to the 404 path rather than crashing the route.
   */
  const payload = await verifySession(lng);
  const hunterId = Number(payload.sub);
  if (!Number.isFinite(hunterId)) {
    notFound();
  }

  return (
    <main className="flex w-full min-h-[calc(100vh-(var(--header-height)+var(--footer-height)))] flex-col">
      <Section
        fluid
        classNames="bg-pattern flex flex-1 flex-col"
      >
        <MyReportsPage hunterId={hunterId} lng={lng} />
      </Section>
    </main>
  );
}
