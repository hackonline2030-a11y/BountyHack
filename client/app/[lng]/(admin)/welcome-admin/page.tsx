import type { Metadata } from "next";
import Link from "next/link";
import { getT } from "next-i18next/server";
import { notFound } from "next/navigation";
import { Section } from "@modules/app/nextjs/components/sections/Section";
import { getWelcomeUser } from "@/lib/dal/welcome-user";
import { verifySessionForRoles } from "@/lib/dal/session";
import { AppRoleCode } from "@/lib/app-role-code";
import { isSupportedLanguage } from "@modules/auth/core/model/locale.policy";

type PageProps = { params: Promise<{ lng: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lng } = await params;
  const { t } = await getT("welcomeHunter", { lng });
  return { title: t("welcomeHunter.metaTitle") };
}

export default async function WelcomeAdminPage({ params }: PageProps) {
  const { lng } = await params;
  if (!isSupportedLanguage(lng)) {
    notFound();
  }
  await verifySessionForRoles(lng, [AppRoleCode.SUPER_ADMIN]);
  const { displayName } = await getWelcomeUser(lng);
  const { t } = await getT("welcomeHunter", { lng });
  const heading =
    displayName !== null
      ? t("welcomeHunter.headingWithUsername", { username: displayName })
      : t("welcomeHunter.heading");

  return (
    <main className="flex w-full min-h-[calc(100vh-(var(--header-height)+var(--footer-height)))] flex-col">
      <Section
        fluid
        classNames="flex min-h-0 flex-1 flex-col items-center justify-center bg-pattern"
      >
        <article className="flex w-full max-w-md flex-col items-center gap-6 px-5 py-8 sm:px-6">
          <h1 className="text-center text-3xl font-bold text-white">
            {heading}
          </h1>
          <nav className="flex flex-col items-center gap-3 text-sm">
            <Link
              href={`/${lng}/administration`}
              className="text-white/90 underline-offset-2 hover:text-white hover:underline"
            >
              Administration
            </Link>
            <Link
              href={`/${lng}/administration/team-management`}
              className="text-white/90 underline-offset-2 hover:text-white hover:underline"
            >
              Équipes rapport (super admin)
            </Link>
          </nav>
        </article>
      </Section>
    </main>
  );
}
