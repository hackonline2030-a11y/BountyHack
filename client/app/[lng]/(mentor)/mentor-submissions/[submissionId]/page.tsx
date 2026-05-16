import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppRoleCode } from "@/lib/app-role-code";
import { verifySession, verifySessionForRoles } from "@/lib/dal/session";
import { isSupportedLanguage } from "@modules/auth/core/model/locale.policy";
import { Section } from "@modules/app/nextjs/components/sections/Section";
import { MentorSubmissionReviewBootstrap } from "@modules/report-draft/react/pages/MentorSubmissionReviewBootstrap";

type PageProps = {
  params: Promise<{ lng: string; submissionId: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Revue mentor" };
}

export default async function MentorSubmissionReviewPage({ params }: PageProps) {
  const { lng, submissionId } = await params;
  if (!isSupportedLanguage(lng)) {
    notFound();
  }
  await verifySessionForRoles(lng, [AppRoleCode.MENTOR]);

  const payload = await verifySession(lng);
  const reviewerId = payload.sub?.trim();
  if (!reviewerId) {
    notFound();
  }

  return (
    <main className="flex w-full min-h-[calc(100vh-(var(--header-height)+var(--footer-height)))] flex-col">
      <Section fluid classNames="flex min-h-0 flex-1 flex-col bg-pattern py-6">
        <MentorSubmissionReviewBootstrap
          submissionId={submissionId}
          reviewerId={reviewerId}
          lng={lng}
        />
      </Section>
    </main>
  );
}
