import type { IClockProvider } from "@modules/core/provider/clock-provider";
import type { IIdProvider } from "@modules/core/provider/id-provider";
import type { IReportDraftRepository } from "@modules/report-draft/core/repository/report-draft.repository";
import type { IReviewerCommentRepository } from "@modules/report-draft/core/repository/reviewer-comment.repository";
import type { ISubmissionRepository } from "@modules/report-draft/core/repository/submission.repository";
import type { IGlobalSubmissionRepository } from "@modules/report-draft/core/repository/global-submission.repository";
import type { IReportTeamRepository } from "@modules/report-team/core/repository/report-team.repository";

/**
 * DI bag forwarded to Redux thunks as `extraArgument`. Every outbound
 * port the app talks to should live here; production wires concrete
 * adapters in `App.constructor` (`modules/app/main.ts`), tests inject
 * stubs via `createStore({ dependencies: { ... } })`.
 */
export type Dependencies = {
  idProvider: IIdProvider;
  clock: IClockProvider;
  reportDraftRepository: IReportDraftRepository;
  submissionRepository: ISubmissionRepository;
  globalSubmissionRepository: IGlobalSubmissionRepository;
  reviewerCommentRepository: IReviewerCommentRepository;
  reportTeamRepository: IReportTeamRepository;
};
