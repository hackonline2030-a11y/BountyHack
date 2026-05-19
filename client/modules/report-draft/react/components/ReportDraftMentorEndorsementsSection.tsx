"use client";

import { type FC, useMemo } from "react";
import { useParams } from "next/navigation";
import { useT } from "next-i18next/client";
import {
  listMentorEndorsements,
  reviewerDisplayNameFromTeam,
} from "@modules/report-draft/core/view/hunter-draft-review-activity";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { reportDraftStepLabel } from "@modules/report-draft/react/wizard/report-draft-step-labels";
import { useAppSelector } from "@store/redux/store";

type Props = {
  step: ReportDraftDomainModel.ReportDraftStep;
};

/**
 * Mentor « avis favorable » for the active wizard step only (onglet Commentaires).
 */
export const ReportDraftMentorEndorsementsSection: FC<Props> = ({ step }) => {
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
    return listMentorEndorsements(draft, submissions).filter((e) => e.step === step);
  }, [draft, submissionsById, step]);

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

  if (!draft || endorsements.length === 0) return null;

  const stepLabel = reportDraftStepLabel(step, lng);

  return (
    <section className="flex flex-col gap-2" aria-labelledby="mentor-endorsements-heading">
      <h2
        id="mentor-endorsements-heading"
        className="text-sm font-semibold text-form-text"
      >
        {t("myReports.activity.mentorEndorsementsTitleStep", { step: stepLabel })}
      </h2>
      <ul className="flex flex-col gap-2">
        {endorsements.map((e, index) => {
          const name = reviewerDisplayNameFromTeam(draft, e.decidedBy);
          const dateStr = dateFmt.format(new Date(e.decidedAt));
          return (
            <li
              key={`${e.step}-${e.decidedAt}-${e.decidedBy}-${index}`}
              className="rounded-md border border-emerald-200 bg-emerald-50/95 px-3 py-2 text-sm text-emerald-950"
            >
              {t("myReports.activity.mentorEndorsementItemStep", { name, date: dateStr })}
            </li>
          );
        })}
      </ul>
    </section>
  );
};
