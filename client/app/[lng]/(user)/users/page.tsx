import type { Metadata } from "next";
import { getT } from "next-i18next/server";
import { notFound } from "next/navigation";
import { Section } from "@modules/app/nextjs/components/sections/Section";
import { verifySession } from "@/lib/dal/session";
import { listUsersDirectory } from "@/lib/dal/users-directory";
import { isSupportedLanguage } from "@modules/auth/core/model/locale.policy";
import { UsersDirectoryPanel } from "@modules/users/react/UsersDirectoryPanel";

type PageProps = { params: Promise<{ lng: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lng } = await params;
  const { t } = await getT("users", { lng });
  return { title: t("metaTitle") };
}

export default async function UsersDirectoryPage({ params }: PageProps) {
  const { lng } = await params;
  if (!isSupportedLanguage(lng)) notFound();
  await verifySession(lng);
  const result = await listUsersDirectory(lng);

  return (
    <main className="flex min-h-[calc(100vh-(var(--header-height)+var(--footer-height)))] w-full flex-col bg-slate-50">
      <Section fluid classNames="flex flex-1 flex-col px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-3xl rounded-xl bg-white p-5 shadow-sm sm:p-8">
          <UsersDirectoryPanel
            initialUsers={result.ok ? result.items : []}
            loadError={!result.ok}
          />
        </div>
      </Section>
    </main>
  );
}
