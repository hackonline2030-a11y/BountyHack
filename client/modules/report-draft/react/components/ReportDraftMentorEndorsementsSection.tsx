"use client";

import { type FC, useMemo } from "react";
import { useParams } from "next/navigation";
import { useT } from "next-i18next/client";
import {
  listMentorEndorsements,
  reviewerDisplayNameFromTeam,
} from "@modules/report-draft/core/view/hunter-draft-review-activity";
import { reportDraftStepLabel } from "@modules/report-draft/react/wizard/report-draft-step-labels";
import { useAppSelector } from "@store/redux/store";

/**
 * Lists every mentor « avis favorable » on the draft (all steps), with step and mentor name.
 */
export const ReportDraftMentorEndorsementsSection: FC = () => {
  const params = useParams<{ lng?: string }>();
  const lng = typeof params?.lng === "string" ? params.lng : "fr";
  const { t } = useT("myReports");
  const draftId = useAppSelector((s) => s.reportDrafts.currentDraftId);
  const draft = useAppSelector((s) =>
    draftId ? s.reportDrafts.byId[draftId] : undefined,
  );
  const submissionsById = useAppSelector((s) => s.reportDrafts.submissionsById);

  const endorsements = useMemo(() => {
    if (!draft) return [];
    const submissions = Object.values(submissionsById).filter(
      (s) => s.reportDraftId === draft.id,
    );
    return listMentorEndorsements(draft, submissions);
  }, [draft, submissionsById]);

  const dateFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(lng.startsWith("en") ? "en" : "fr", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
    [lng],
  );

  if (!draft) return null;

  return (
    <section className="flex flex-col gap-2" aria-labelledby="mentor-endorsements-heading">
      <h2
        id="mentor-endorsements-heading"
        className="text-sm font-semibold text-form-text"
      >
        {t("myReports.activity.mentorEndorsementsTitle")}
      </h2>
      {endorsements.length === 0 ? (
        <p className="text-sm text-form-text-muted">
          {t("myReports.activity.mentorEndorsementsEmpty")}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {endorsements.map((e, index) => {
            const name = reviewerDisplayNameFromTeam(draft, e.decidedBy);
            const step = reportDraftStepLabel(e.step, lng);
            const dateStr = dateFmt.format(new Date(e.decidedAt));
            return (
              <li
                key={`${e.step}-${e.decidedAt}-${e.decidedBy}-${index}`}
                className="rounded-md border border-emerald-200 bg-emerald-50/95 px-3 py-2 text-sm text-emerald-950"
              >
                {t("myReports.activity.mentorEndorsementItem", { step, name, date: dateStr })}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
