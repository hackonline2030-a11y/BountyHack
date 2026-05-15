"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useT } from "next-i18next/client";
import {
  STEP_TITLE_EN,
  STEP_TITLE_FR,
} from "@modules/report-draft/core/model/step-field-catalog";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { useAppSelector } from "@store/redux/store";

function decisionLabel(
  s: ReportDraftDomainModel.Submission<unknown>,
  t: (key: string) => string,
): string {
  return t(`myReports.reviewHistory.decision.${s.decision}`);
}

function sortKey(submittedAt: string, decidedAt?: string): number {
  const d = decidedAt?.trim() ? Date.parse(decidedAt) : 0;
  const u = Date.parse(submittedAt);
  return Math.max(
    Number.isFinite(d) ? d : 0,
    Number.isFinite(u) ? u : 0,
  );
}

function stepTitle(
  step: ReportDraftDomainModel.ReportDraftStep,
  lng: string,
): string {
  return lng.startsWith("en") ? STEP_TITLE_EN[step] : STEP_TITLE_FR[step];
}

type Props = {
  lng: string;
};

/** Read-only overview of review rounds for all drafts listed on “Mes rapports”. */
export const HunterReviewHistoryTable: React.FC<Props> = ({ lng }) => {
  const { t } = useT(["myReports", "reportTeams"]);
  const myDraftIds = useAppSelector((s) => s.reportDrafts.myDraftIds);
  const submissionsById = useAppSelector((s) => s.reportDrafts.submissionsById);
  const draftsById = useAppSelector((s) => s.reportDrafts.byId);

  const rows = useMemo(() => {
    const idSet = new Set(myDraftIds);
    const list = Object.values(submissionsById).filter((s) => idSet.has(s.reportDraftId));
    return list.sort((a, b) => sortKey(b.submittedAt, b.decidedAt) - sortKey(a.submittedAt, a.decidedAt));
  }, [myDraftIds, submissionsById]);

  const dateFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(lng, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    [lng],
  );

  if (rows.length === 0) {
    return (
      <section className="mt-10 border-t border-dashboard-divider pt-8">
        <h2 className="text-lg font-semibold text-dashboard-text">
          {t("myReports.reviewHistory.title")}
        </h2>
        <p className="mt-1 text-sm text-dashboard-text-muted">
          {t("myReports.reviewHistory.subtitle")}
        </p>
        <p className="mt-4 rounded-lg border border-dashboard-card-border bg-white px-4 py-3 text-sm text-dashboard-text-muted">
          {t("myReports.reviewHistory.empty")}
        </p>
      </section>
    );
  }

  return (
    <section className="mt-10 border-t border-dashboard-divider pt-8">
      <h2 className="text-lg font-semibold text-dashboard-text">
        {t("myReports.reviewHistory.title")}
      </h2>
      <p className="mt-1 text-sm text-dashboard-text-muted">
        {t("myReports.reviewHistory.subtitle")}
      </p>

      <div className="mt-4 overflow-x-auto rounded-lg border border-dashboard-card-border bg-dashboard-card shadow-sm">
        <table className="min-w-full divide-y divide-dashboard-card-border text-left text-sm">
          <thead className="bg-dashboard-card/80">
            <tr>
              <th className="px-3 py-2 font-semibold text-dashboard-text">
                {t("myReports.reviewHistory.colReport")}
              </th>
              <th className="px-3 py-2 font-semibold text-dashboard-text">
                {t("myReports.reviewHistory.colStep")}
              </th>
              <th className="px-3 py-2 font-semibold text-dashboard-text">
                {t("myReports.reviewHistory.colRound")}
              </th>
              <th className="px-3 py-2 font-semibold text-dashboard-text">
                {t("myReports.reviewHistory.colReviewerRole")}
              </th>
              <th className="px-3 py-2 font-semibold text-dashboard-text">
                {t("myReports.reviewHistory.colDecision")}
              </th>
              <th className="px-3 py-2 font-semibold text-dashboard-text">
                {t("myReports.reviewHistory.colDate")}
              </th>
              <th className="px-3 py-2 font-semibold text-dashboard-text">
                {t("myReports.reviewHistory.colOpen")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dashboard-card-border">
            {rows.map((s) => {
              const draft = draftsById[s.reportDraftId];
              const teamLabel = draft?.reportTeam?.label?.trim();
              const contentTitle = draft?.meta.payload.reportTitle?.trim() ?? "";
              const reportLabel =
                teamLabel ||
                (contentTitle === "" ? t("myReports.card.untitled") : contentTitle);
              const when = s.decidedAt?.trim()
                ? s.decidedAt
                : s.submittedAt;
              const roleLabel = t(`reportTeams:reportTeams.roles.${s.reviewerRole}`);
              return (
                <tr key={s.id} className="hover:bg-dashboard-card/40">
                  <td className="px-3 py-2 text-dashboard-text">{reportLabel}</td>
                  <td className="px-3 py-2 text-dashboard-text-muted">
                    {stepTitle(s.step, lng)}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-dashboard-text-muted">
                    {s.round}
                  </td>
                  <td className="px-3 py-2 text-dashboard-text-muted">{roleLabel}</td>
                  <td className="px-3 py-2 text-dashboard-text">
                    {decisionLabel(s, t)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-dashboard-text-muted">
                    {dateFmt.format(new Date(when))}
                    <span className="ml-1 block text-[10px] uppercase tracking-wide text-dashboard-text-subtle">
                      {s.decidedAt?.trim()
                        ? t("myReports.reviewHistory.dateDecided")
                        : t("myReports.reviewHistory.dateSubmitted")}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/${lng}/report-draft/${s.reportDraftId}`}
                      className="text-dashboard-accent hover:underline"
                    >
                      →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};
