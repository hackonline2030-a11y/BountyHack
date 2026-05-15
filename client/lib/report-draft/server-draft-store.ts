import "server-only";

import { InMemoryReportDraftRepository } from "@modules/report-draft/core/repository-infra/in-memory.report-draft.repository-infra";
import { InMemoryReviewerCommentRepository } from "@modules/report-draft/core/repository-infra/in-memory.reviewer-comment.repository-infra";
import { InMemorySubmissionRepository } from "@modules/report-draft/core/repository-infra/in-memory.submission.repository-infra";

type ServerDraftStore = {
  reportDraftRepository: InMemoryReportDraftRepository;
  submissionRepository: InMemorySubmissionRepository;
  reviewerCommentRepository: InMemoryReviewerCommentRepository;
};

const globalKey = "__bugbounty_report_draft_store__" as const;

/**
 * Process-wide in-memory persistence for report-draft workflow (dev / demo).
 * Shared across all BFF requests — enables hunter + QC in two browsers.
 */
export function getServerDraftStore(): ServerDraftStore {
  const g = globalThis as typeof globalThis & {
    [globalKey]?: ServerDraftStore;
  };
  if (!g[globalKey]) {
    g[globalKey] = {
      reportDraftRepository: new InMemoryReportDraftRepository(),
      submissionRepository: new InMemorySubmissionRepository(),
      reviewerCommentRepository: new InMemoryReviewerCommentRepository(),
    };
  }
  return g[globalKey];
}
