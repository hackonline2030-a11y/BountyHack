import type { Metadata } from "next";
import { getT } from "next-i18next/server";
import { ActionLink } from "@modules/app/nextjs/components/buttons/ActionLink";
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
          <header className="dashboard-card px-6 py-8 text-left sm:px-8 sm:py-10">
            <h1 className="text-3xl font-bold text-dashboard-text">
              {t("administrationPage.heading")}
            </h1>
            <p className="mt-2 text-sm text-dashboard-text-muted">
              {t("administrationPage.subheading")}
            </p>
            <div className="mt-6 flex justify-start">
              <ActionLink href={`/${lng}/administration/register`}>
                {t("administrationPage.registerLink")}
              </ActionLink>
            </div>
          </header>

          {result.ok ? (
            <UserManagementTable lng={lng} users={result.items} />
          ) : (
            <p
              role="alert"
              className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900"
            >
              {t(`administrationPage.errors.${result.reason}`)}
            </p>
          )}
        </article>
      </Section>
    </main>
  );
}
