import type { Metadata } from "next";
import Link from "next/link";
import { getT } from "next-i18next/server";
import { notFound } from "next/navigation";
import { Section } from "@modules/app/nextjs/components/sections/Section";
import { UserManagementTable } from "@modules/admin/nextjs/components/UserManagementTable";
import { verifySessionForRoles } from "@/lib/dal/session";
import { listAdminUsers } from "@/lib/dal/admin-users";
import { AppRoleCode } from "@/lib/app-role-code";
import { isSupportedLanguage } from "@modules/auth/core/model/locale.policy";

type PageProps = { params: Promise<{ lng: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lng } = await params;
  const { t } = await getT("administration", { lng });
  return { title: t("administrationPage.metaTitle") };
}

export default async function AdministrationPage({ params }: PageProps) {
  const { lng } = await params;
  if (!isSupportedLanguage(lng)) {
    notFound();
  }

  /**
   * Page-level gate, identical to every admin route:
   *   - no session              → redirect /{lng}/login (inherited from verifySession)
   *   - session but not admin   → notFound() (404, no route disclosure)
   * The Nest endpoint re-checks the role, so this gate is for UX + defence in depth.
   */
  await verifySessionForRoles(lng, [AppRoleCode.SUPER_ADMIN]);

  const [{ t }, result] = await Promise.all([
    getT(["administration", "common"], { lng }),
    listAdminUsers(lng),
  ]);

  return (
    <main className="flex w-full min-h-[calc(100vh-(var(--header-height)+var(--footer-height)))] flex-col">
      <Section
        fluid
        classNames="flex min-h-0 flex-1 flex-col items-center justify-start bg-pattern py-10"
      >
        <article className="flex w-full max-w-4xl flex-col items-stretch gap-6 px-5 sm:px-6">
          <header className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-3xl font-bold text-white">
              {t("administrationPage.heading")}
            </h1>
            <p className="text-sm text-white/80">
              {t("administrationPage.subheading")}
            </p>
          </header>

          <div className="flex justify-end">
            <Link
              href={`/${lng}/administration/register`}
              className="btn-common-styles btn-primary"
            >
              {t("administrationPage.registerLink")}
            </Link>
          </div>

          {result.ok ? (
            <UserManagementTable lng={lng} users={result.items} />
          ) : (
            <p
              role="alert"
              className="rounded-md border border-red-300/40 bg-red-500/10 px-4 py-3 text-sm text-red-100"
            >
              {t(`administrationPage.errors.${result.reason}`)}
            </p>
          )}
        </article>
      </Section>
    </main>
  );
}
