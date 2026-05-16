import type { FC } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { localePrefixFromPathname } from "@/lib/locale-path";
import { Section } from "@modules/app/nextjs/components/sections/Section";
import type {
  ReportTeam,
  ReportTeamJoinRequest,
  ReportTeamMemberRole,
} from "@modules/report-team/model/report-team.types";
import { ReportTeamAskJoinForm } from "@modules/report-team/react/ReportTeamAskJoinForm";
import { ReportTeamEnrollButton } from "@modules/report-team/react/ReportTeamEnrollButton";
import type { buildAskJoinLabels } from "@modules/report-team/react/build-ask-join-labels";
import { ReportTeamMockBanner } from "@modules/report-team/react/ReportTeamMockBanner";
import { ReportTeamValidityBadge } from "@modules/report-team/react/ReportTeamValidityBadge";

type Copy = {
  heading: string;
  subheading: string;
  mockBanner: string;
  validityValid: string;
  validityIncomplete: string;
  validityHint: string;
  myTeamsTitle: string;
  myTeamsEmpty: string;
  membersLabel: string;
  updatedLabel: string;
  requestsTitle: string;
  requestsEmpty: string;
  statusPending: string;
  statusApproved: string;
  statusRejected: string;
  submittedAt: string;
  enrollTitle: string;
  enrollDescription: string;
  enrollSubmit: string;
  enrollSubmitting: string;
  enrollSuccess: string;
  enrollAlreadyPending: string;
  enrollErrorGeneric: string;
  askTitle: string;
  askDescription: string;
  openReportDraft: string;
  roleLabels: Record<ReportTeamMemberRole, string>;
  backHref?: string;
  backLabel?: string;
};

type Props = {
  copy: Copy;
  teams: ReadonlyArray<ReportTeam>;
  joinableTeams: ReadonlyArray<ReportTeam>;
  joinRequests: ReadonlyArray<ReportTeamJoinRequest>;
  defaultRole: ReportTeamMemberRole;
  roleOptions: ReadonlyArray<ReportTeamMemberRole>;
  askJoinLabels: ReturnType<typeof buildAskJoinLabels>;
  showMockBanner?: boolean;
  /** Hunters open the draft from here; reviewers use the review queue after a revision request. */
  showOpenReportDraftLink?: boolean;
};

export const ReportTeamsMemberPage: FC<Props> = ({
  copy,
  teams,
  joinableTeams,
  joinRequests,
  defaultRole,
  roleOptions,
  askJoinLabels,
  showMockBanner = false,
  showOpenReportDraftLink = false,
}) => {
  const pathname = usePathname();
  const prefix = localePrefixFromPathname(pathname);
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
          <div className="dashboard-card flex flex-col gap-4 p-5 sm:p-6">
            {copy.backHref && copy.backLabel ? (
              <Link href={copy.backHref} className="dashboard-card-cta w-fit text-sm">
                ← {copy.backLabel}
              </Link>
            ) : null}
            <header>
              <h1 className="text-2xl font-bold tracking-tight text-dashboard-text sm:text-3xl">
                {copy.heading}
              </h1>
              <p className="mt-1 text-sm text-dashboard-text-muted sm:text-base">
                {copy.subheading}
              </p>
            </header>
            {showMockBanner ? <ReportTeamMockBanner message={copy.mockBanner} /> : null}
            <p className="text-sm text-dashboard-text-muted">{copy.validityHint}</p>
          </div>

          <section className="dashboard-card p-4 sm:p-5" aria-labelledby="rt-my-teams">
            <h2 id="rt-my-teams" className="text-base font-semibold text-dashboard-text">
              {copy.myTeamsTitle}
            </h2>
            {teams.length === 0 ? (
              <p className="mt-3 text-sm text-dashboard-text-muted">{copy.myTeamsEmpty}</p>
            ) : (
              <ul role="list" className="mt-4 flex flex-col gap-4">
                {teams.map((team) => (
                  <li
                    key={team.id}
                    className="rounded-lg border border-dashboard-card-border p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-dashboard-text">{team.label}</p>
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
                    {showOpenReportDraftLink ? (
                      <Link
                        href={`${prefix}/report-draft/${team.reportDraftId}`}
                        className="dashboard-card-cta mt-3 inline-block text-sm"
                      >
                        {copy.openReportDraft} →
                      </Link>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="dashboard-card p-4 sm:p-5" aria-labelledby="rt-requests">
            <h2 id="rt-requests" className="text-base font-semibold text-dashboard-text">
              {copy.requestsTitle}
            </h2>
            {joinRequests.length === 0 ? (
              <p className="mt-3 text-sm text-dashboard-text-muted">{copy.requestsEmpty}</p>
            ) : (
              <ul role="list" className="mt-4 flex flex-col divide-y divide-dashboard-divider">
                {joinRequests.map((req) => (
                  <li key={req.id} className="py-3 first:pt-0 last:pb-0">
                    <p className="text-sm font-medium text-dashboard-text">
                      {req.teamId ? req.teamLabel : copy.enrollTitle}
                    </p>
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
            id="enroll"
            className="dashboard-card scroll-mt-24 p-4 sm:p-5"
            aria-labelledby="rt-enroll"
          >
            <h2 id="rt-enroll" className="text-base font-semibold text-dashboard-text">
              {copy.enrollTitle}
            </h2>
            <div className="mt-4">
              <ReportTeamEnrollButton
                requestedRole={defaultRole}
                joinRequests={joinRequests}
                labels={{
                  description: copy.enrollDescription,
                  submit: copy.enrollSubmit,
                  submitting: copy.enrollSubmitting,
                  success: copy.enrollSuccess,
                  alreadyPending: copy.enrollAlreadyPending,
                  errorGeneric: copy.enrollErrorGeneric,
                }}
              />
            </div>
          </section>

          {joinableTeams.length > 0 ? (
          <section
            id="ask-join"
            className="dashboard-card scroll-mt-24 p-4 sm:p-5"
            aria-labelledby="rt-ask"
          >
            <h2 id="rt-ask" className="text-base font-semibold text-dashboard-text">
              {copy.askTitle}
            </h2>
            <p className="mt-1 text-sm text-dashboard-text-muted">{copy.askDescription}</p>
            <div className="mt-4">
              <ReportTeamAskJoinForm
                joinableTeams={joinableTeams}
                defaultRole={defaultRole}
                roleOptions={roleOptions}
                labels={askJoinLabels}
              />
            </div>
          </section>
          ) : null}
        </div>
      </Section>
    </main>
  );
};
