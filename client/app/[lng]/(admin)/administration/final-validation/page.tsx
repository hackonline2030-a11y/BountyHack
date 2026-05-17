import type { Metadata } from "next";
import Link from "next/link";
import { getT } from "next-i18next/server";
import { notFound } from "next/navigation";
import { Section } from "@modules/app/nextjs/components/sections/Section";
import { ReportDraftFinalValidationQueueTable } from "@modules/report-draft/react/components/admin/ReportDraftFinalValidationQueueTable";
import { verifySessionForRoles } from "@/lib/dal/session";
import { listReportDraftsForFinalValidation } from "@/lib/dal/report-draft-final-validation";
import { AppRoleCode } from "@/lib/app-role-code";
import { isSupportedLanguage } from "@modules/auth/core/model/locale.policy";

type PageProps = { params: Promise<{ lng: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lng } = await params;
  const { t } = await getT("reportDraft", { lng });
  return { title: t("reportDraft.finalValidation.metaTitle") };
}

export default async function FinalValidationPage({ params }: PageProps) {
  const { lng } = await params;
  if (!isSupportedLanguage(lng)) {
    notFound();
  }

  await verifySessionForRoles(lng, [AppRoleCode.SUPER_ADMIN]);

  const [{ t }, result] = await Promise.all([
    getT("reportDraft", { lng }),
    listReportDraftsForFinalValidation(lng),
  ]);

  return (
    <main className="flex w-full min-h-[calc(100vh-(var(--header-height)+var(--footer-height)))] flex-col">
      <Section
        fluid
        classNames="flex min-h-0 flex-1 flex-col items-center justify-start bg-pattern py-10"
      >
        <article className="flex w-full max-w-6xl flex-col items-stretch gap-6 px-5 sm:px-6">
          <header className="dashboard-card px-6 py-8 text-center sm:px-8 sm:py-10">
            <h1 className="text-3xl font-bold text-dashboard-text">
              {t("reportDraft.finalValidation.heading")}
            </h1>
            <p className="mt-2 text-sm text-dashboard-text-muted">
              {t("reportDraft.finalValidation.subheading")}
            </p>
            <div className="mt-6 flex justify-center">
              <Link
                href={`/${lng}/welcome-admin`}
                className="text-sm font-medium text-dashboard-accent hover:underline"
              >
                {t("reportDraft.finalValidation.backToAdmin")}
              </Link>
            </div>
          </header>

          {result.ok ? (
            <ReportDraftFinalValidationQueueTable lng={lng} items={result.items} />
          ) : (
            <p
              role="alert"
              className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900"
            >
              {t(`reportDraft.finalValidation.errors.${result.reason}`)}
            </p>
          )}
        </article>
      </Section>
    </main>
  );
}
