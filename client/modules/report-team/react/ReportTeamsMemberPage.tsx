import type { FC } from "react";
import Link from "next/link";
import { Section } from "@modules/app/nextjs/components/sections/Section";
import {
  myJoinRequestsFixture,
  reportTeamsFixture,
} from "@modules/report-team/fixtures/report-team.fixtures";
import { ReportTeamAskJoinForm } from "@modules/report-team/react/ReportTeamAskJoinForm";
import { buildAskJoinLabels } from "@modules/report-team/react/build-ask-join-labels";
import { ReportTeamMockBanner } from "@modules/report-team/react/ReportTeamMockBanner";
import { ReportTeamValidityBadge } from "@modules/report-team/react/ReportTeamValidityBadge";
import type { ReportTeamMemberRole } from "@modules/report-team/model/report-team.types";

type Copy = {
  metaTitle: string;
  heading: string;
  subheading: string;
  mockBanner: string;
  validityValid: string;
  validityIncomplete: string;
  validityHint: string;
  myTeamsTitle: string;
  myTeamsEmpty: string;
  teamIdLabel: string;
  membersLabel: string;
  updatedLabel: string;
  requestsTitle: string;
  requestsEmpty: string;
  statusPending: string;
  statusApproved: string;
  statusRejected: string;
  submittedAt: string;
  askTitle: string;
  askDescription: string;
  roleLabels: Record<ReportTeamMemberRole, string>;
  backHref?: string;
  backLabel?: string;
};

type Props = {
  copy: Copy;
  defaultRole: ReportTeamMemberRole;
  roleOptions: ReadonlyArray<ReportTeamMemberRole>;
  askJoinLabels: ReturnType<typeof buildAskJoinLabels>;
};

export const ReportTeamsMemberPage: FC<Props> = ({
  copy,
  defaultRole,
  roleOptions,
  askJoinLabels,
}) => {
  const dateFormatter = new Intl.DateTimeFormat("fr", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <main className="flex w-full min-h-[calc(100vh-(var(--header-height)+var(--footer-height)))] flex-col">
      <Section
        fluid
        classNames="bg-pattern flex flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
      >
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
          {copy.backHref && copy.backLabel ? (
            <Link href={copy.backHref} className="dashboard-card-cta w-fit text-sm">
              ← {copy.backLabel}
            </Link>
          ) : null}
          <header>
            <h1 className="text-2xl font-bold tracking-tight text-dashboard-heading-on-pattern sm:text-3xl">
              {copy.heading}
            </h1>
            <p className="mt-1 text-sm text-dashboard-subheading-on-pattern sm:text-base">
              {copy.subheading}
            </p>
          </header>
          <ReportTeamMockBanner message={copy.mockBanner} />
          <p className="text-sm text-dashboard-text-muted">{copy.validityHint}</p>

          <section className="dashboard-card p-4 sm:p-5" aria-labelledby="rt-my-teams">
            <h2 id="rt-my-teams" className="text-base font-semibold text-dashboard-text">
              {copy.myTeamsTitle}
            </h2>
            {reportTeamsFixture.length === 0 ? (
              <p className="mt-3 text-sm text-dashboard-text-muted">{copy.myTeamsEmpty}</p>
            ) : (
              <ul role="list" className="mt-4 flex flex-col gap-4">
                {reportTeamsFixture.map((team) => (
                  <li
                    key={team.id}
                    className="rounded-lg border border-dashboard-card-border p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-dashboard-text">{team.label}</p>
                        <p className="mt-1 font-mono text-xs text-dashboard-text-muted">
                          {copy.teamIdLabel}: {team.id}
                        </p>
                      </div>
                      <ReportTeamValidityBadge
                        validity={team.validity}
                        validLabel={copy.validityValid}
                        incompleteLabel={copy.validityIncomplete}
                      />
                    </div>
                    <p className="mt-3 text-xs font-medium uppercase tracking-wide text-dashboard-text-muted">
                      {copy.membersLabel}
                    </p>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {team.members.map((m) => (
                        <li
                          key={m.userId}
                          className="rounded-full bg-dashboard-accent-soft px-2.5 py-1 text-xs text-dashboard-text"
                        >
                          {m.displayName}{" "}
                          <span className="text-dashboard-text-muted">
                            ({copy.roleLabels[m.role]})
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-xs text-dashboard-text-subtle">
                      {copy.updatedLabel}:{" "}
                      {dateFormatter.format(new Date(team.updatedAt))}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="dashboard-card p-4 sm:p-5" aria-labelledby="rt-requests">
            <h2 id="rt-requests" className="text-base font-semibold text-dashboard-text">
              {copy.requestsTitle}
            </h2>
            {myJoinRequestsFixture.length === 0 ? (
              <p className="mt-3 text-sm text-dashboard-text-muted">{copy.requestsEmpty}</p>
            ) : (
              <ul role="list" className="mt-4 flex flex-col divide-y divide-dashboard-divider">
                {myJoinRequestsFixture.map((req) => (
                  <li key={req.id} className="py-3 first:pt-0 last:pb-0">
                    <p className="text-sm font-medium text-dashboard-text">{req.teamLabel}</p>
                    <p className="font-mono text-xs text-dashboard-text-muted">{req.teamId}</p>
                    <p className="mt-1 text-xs text-dashboard-text-muted">
                      {copy.roleLabels[req.requestedRole]} ·{" "}
                      {req.status === "pending"
                        ? copy.statusPending
                        : req.status === "approved"
                          ? copy.statusApproved
                          : copy.statusRejected}
                    </p>
                    <p className="text-xs text-dashboard-text-subtle">
                      {copy.submittedAt.replace(
                        "{{date}}",
                        dateFormatter.format(new Date(req.requestedAt)),
                      )}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section
            id="ask-join"
            className="dashboard-card p-4 sm:p-5 scroll-mt-24"
            aria-labelledby="rt-ask"
          >
            <h2 id="rt-ask" className="text-base font-semibold text-dashboard-text">
              {copy.askTitle}
            </h2>
            <p className="mt-1 text-sm text-dashboard-text-muted">{copy.askDescription}</p>
            <div className="mt-4">
              <ReportTeamAskJoinForm
                defaultRole={defaultRole}
                roleOptions={roleOptions}
                labels={askJoinLabels}
              />
            </div>
          </section>
        </div>
      </Section>
    </main>
  );
};
