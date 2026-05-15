"use client";

import Link from "next/link";
import { useEffect } from "react";
import { loadSubmissionForReview } from "@modules/report-draft/core/useCase/load-submission-for-review.usecase";
import { SubmissionReviewBoard } from "@modules/report-draft/react/pages/SubmissionReviewBoard";
import { useAppDispatch, useAppSelector } from "@store/redux/store";

type Props = {
  submissionId: string;
  reviewerId: string;
  lng: string;
};

export const SubmissionReviewBootstrap: React.FC<Props> = ({
  submissionId,
  reviewerId,
  lng,
}) => {
  const dispatch = useAppDispatch();
  const reviewLoad = useAppSelector((s) => s.reportDrafts.reviewLoad);
  const loadedSubmissionId = useAppSelector((s) => s.reportDrafts.currentSubmissionId);
  const submission = useAppSelector((s) => s.reportDrafts.submissionsById[submissionId]);

  useEffect(() => {
    void dispatch(loadSubmissionForReview({ submissionId }));
  }, [dispatch, submissionId]);

  const isReviewReady =
    reviewLoad.status === "success" &&
    loadedSubmissionId === submissionId &&
    submission != null;

  if (reviewLoad.status === "loading" || reviewLoad.status === "idle" || !isReviewReady) {
    if (reviewLoad.status === "error") {
      return (
        <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm">
          <p>{reviewLoad.message}</p>
          <Link href={`/${lng}/submissions`} className="mt-2 inline-block text-form-accent">
            ← Retour à la liste
          </Link>
        </div>
      );
    }
    return <p className="text-sm text-form-text-muted">Chargement de la soumission…</p>;
  }

  return (
    <SubmissionReviewBoard
      key={submissionId}
      submissionId={submissionId}
      reviewerId={reviewerId}
      lng={lng}
    />
  );
};
