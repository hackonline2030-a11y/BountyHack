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
   * The hunter's id is the JWT `sub` claim (string, e.g. `"user-42"`),
   * which is also the user uid surfaced by Nest `GET /users/me`. We keep
   * it as-is — the report-draft domain consumes string uids end-to-end.
   * An empty `sub` would mean a broken token; surface as 404.
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
        classNames="bg-pattern flex flex-1 flex-col"
      >
        <MyReportsPage hunterId={hunterId} lng={lng} />
      </Section>
    </main>
  );
}
