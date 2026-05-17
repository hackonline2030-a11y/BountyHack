"use client";

import { type FC, useMemo } from "react";
import { useT } from "next-i18next/client";
import { globalSubmissionsForCurrentRevision } from "@modules/report-draft/core/model/global-submission-revision";
import {
  hasGlobalRevisionApproval,
  hasGlobalRevisionChangeRequests,
  isAwaitingInitialGlobalReviewerDecisions,
  isSuperAdminGlobalRevisionMode,
} from "@modules/report-draft/core/model/super-admin-final-validation";
import { useAppSelector } from "@store/redux/store";

type Props = {
  draftId: string;
  onOpenCommentsTab?: () => void;
  onOpenSuperAdminTab?: () => void;
};

export const GlobalRevisionEventBanner: FC<Props> = ({
  draftId,
  onOpenCommentsTab,
  onOpenSuperAdminTab,
}) => {
  const { t } = useT("myReports");
  const draft = useAppSelector((s) => s.reportDrafts.byId[draftId]);
  const globalSubmissions = useAppSelector((s) =>
    Object.values(s.reportDrafts.globalSubmissionsById),
  );

  const event = useMemo(() => {
    if (!isSuperAdminGlobalRevisionMode(draft)) return null;

    const revision =
      draft.superAdminGlobalRevisionCount ??
      globalSubmissionsForCurrentRevision(draft, globalSubmissions)[0]?.revisionNumber ??
      1;

    if (isAwaitingInitialGlobalReviewerDecisions(draft, globalSubmissions)) {
      return { key: "awaitingReviewers" as const, revision };
    }
    if (hasGlobalRevisionChangeRequests(draft, globalSubmissions)) {
      return { key: "changesRequested" as const, revision };
    }
    if (hasGlobalRevisionApproval(draft, globalSubmissions)) {
      return { key: "partiallyApproved" as const, revision };
    }
    return null;
  }, [draft, globalSubmissions]);

  if (!event) return null;

  const showLinks = event.key === "changesRequested";

  return (
    <p className="rounded-md border border-violet-200 bg-violet-50 px-3 py-2 text-sm text-violet-950">
      <span className="font-medium">
        {t(`myReports.globalRevisionEvent.${event.key}.short`, { revision: event.revision })}
      </span>
      {showLinks ? (
        <span className="text-violet-900">
          {" "}
          —{" "}
          {onOpenCommentsTab ? (
            <button
              type="button"
              className="underline hover:text-violet-700"
              onClick={onOpenCommentsTab}
            >
              {t("myReports.globalRevisionEvent.openCommentsTab")}
            </button>
          ) : null}
          {onOpenCommentsTab && onOpenSuperAdminTab ? " · " : null}
          {onOpenSuperAdminTab ? (
            <button
              type="button"
              className="underline hover:text-violet-700"
              onClick={onOpenSuperAdminTab}
            >
              {t("myReports.globalRevisionEvent.openSuperAdminTab")}
            </button>
          ) : null}
        </span>
      ) : null}
    </p>
  );
};
