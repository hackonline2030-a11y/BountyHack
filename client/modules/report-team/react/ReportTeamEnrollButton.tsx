"use client";

import { useMemo, useState, type FC } from "react";
import type {
  ReportTeamJoinRequest,
  ReportTeamMemberRole,
} from "@modules/report-team/model/report-team.types";
import { requestEnrollment } from "@modules/report-team/core/useCase/request-enrollment.usecase";
import { useAppDispatch } from "@store/redux/store";

type Labels = {
  description: string;
  submit: string;
  submitting: string;
  success: string;
  alreadyPending: string;
  errorGeneric: string;
};

type Props = {
  requestedRole: ReportTeamMemberRole;
  joinRequests: ReadonlyArray<ReportTeamJoinRequest>;
  labels: Labels;
};

export const ReportTeamEnrollButton: FC<Props> = ({
  requestedRole,
  joinRequests,
  labels,
}) => {
  const dispatch = useAppDispatch();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState("");

  const pendingEnrollment = useMemo(
    () => joinRequests.find((r) => !r.teamId && r.status === "pending"),
    [joinRequests],
  );

  async function onEnroll() {
    if (pendingEnrollment) return;
    setStatus("loading");
    setFeedback("");
    try {
      await dispatch(requestEnrollment({ requestedRole }));
      setStatus("success");
      setFeedback(labels.success);
    } catch (error) {
      setStatus("error");
      setFeedback(error instanceof Error ? error.message : labels.errorGeneric);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-dashboard-text-muted">{labels.description}</p>
      {pendingEnrollment ? (
        <p className="text-sm text-amber-700">{labels.alreadyPending}</p>
      ) : null}
      {feedback ? (
        <p
          role="status"
          className={`text-sm ${status === "success" ? "text-emerald-700" : "text-red-600"}`}
        >
          {feedback}
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => void onEnroll()}
        disabled={status === "loading" || pendingEnrollment !== undefined}
        className="btn-common-styles btn-primary w-fit disabled:opacity-50"
      >
        {status === "loading" ? labels.submitting : labels.submit}
      </button>
    </div>
  );
};
