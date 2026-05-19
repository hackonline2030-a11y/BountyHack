"use client";

import { type FC, useMemo } from "react";
import { useT } from "next-i18next/client";
import type { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";
import { globalReviewerCommentsForPlacement } from "@modules/report-draft/core/model/global-submission-revision";
import { useAppSelector } from "@store/redux/store";

const roleLabelFr = (role: ReportDraftDomainModel.ReviewerRole): string => {
  switch (role) {
    case "quality_checker":
      return "Quality checker";
    case "super_admin":
      return "Super-admin";
    default:
      return role;
  }
};

type Props = {
  draftId: string;
  placement: "quality_checker" | "super_admin";
};

export const ReportDraftGlobalCommentsSection: FC<Props> = ({ draftId, placement }) => {
  const { t } = useT("myReports");
  const globalSubmissions = useAppSelector((s) => s.reportDrafts.globalSubmissionsById);
  const commentsById = useAppSelector((s) => s.reportDrafts.globalReviewerCommentsById);

  const groups = useMemo(
    () =>
      globalReviewerCommentsForPlacement(
        draftId,
        Object.values(globalSubmissions),
        Object.values(commentsById),
        placement,
      ),
    [draftId, globalSubmissions, commentsById, placement],
  );

  if (groups.length === 0) return null;

  return (
    <section className="flex flex-col gap-4" aria-labelledby={`global-comments-${placement}`}>
      <h2 id={`global-comments-${placement}`} className="text-sm font-semibold text-form-text">
        {t("myReports.globalComments.sectionTitle")}
      </h2>
      {groups.map((group) => (
        <div
          key={`${group.revisionNumber}-${group.reviewerRole}`}
          className="rounded-md border border-violet-200 bg-violet-50/80 p-4"
        >
          <h3 className="text-xs font-semibold uppercase tracking-wide text-violet-900">
            {t("myReports.globalComments.revisionHeading", {
              revision: group.revisionNumber,
            })}{" "}
            — {roleLabelFr(group.reviewerRole)}
          </h3>
          <ul className="mt-3 flex flex-col gap-2">
            {group.comments.map((c) => (
              <li
                key={c.id}
                className="rounded-md border border-violet-200 bg-white p-3 text-sm text-violet-950"
              >
                <p className="mb-1 text-xs font-medium text-violet-800">
                  {roleLabelFr(c.authorRole)} —{" "}
                  {new Date(c.createdAt).toLocaleString("fr-FR")}
                </p>
                <p className="whitespace-pre-wrap">{c.body}</p>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
};
