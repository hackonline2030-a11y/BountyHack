import { SystemClockProvider } from "@modules/core/provider/system.clock-provider";
import { SystemIdProvider } from "@modules/core/provider/system.id-provider";
import { HttpReportDraftRepository } from "@modules/report-draft/core/repository-infra/http.report-draft.repository-infra";
import { HttpReviewerCommentRepository } from "@modules/report-draft/core/repository-infra/http.reviewer-comment.repository-infra";
import { HttpSubmissionRepository } from "@modules/report-draft/core/repository-infra/http.submission.repository-infra";
import { HttpReportTeamRepository } from "@modules/report-team/core/repository-infra/http.report-team.repository-infra";
import { Dependencies } from "@store/dependencies";
import { AppStore, createStore } from "@store/redux/store";

/**
 * Composition root of the client app: instantiates every concrete adapter
 * and assembles the Redux store with them. Lives at module-init time —
 * the singleton `app` is what `AppWrapper` injects into the React tree.
 *
 * Adapter strategy (V1):
 * - `idProvider`               → `crypto.randomUUID()` (browser + Node ≥ 19)
 * - `clock`                    → `new Date().toISOString()` (UTC ISO 8601)
 * - `reportDraftRepository`      → HTTP → BFF singleton store (shared across browsers)
 * - `submissionRepository`       → HTTP
 * - `reviewerCommentRepository`  → HTTP
 *
 * When a real backend lands, swap one factory at a time without touching
 * the use cases — that's the whole point of the gateway pattern.
 */
export class App {
  public readonly dependencies: Dependencies;
  public readonly store: AppStore;

  constructor() {
    this.dependencies = {
      idProvider: new SystemIdProvider(),
      clock: new SystemClockProvider(),
      reportDraftRepository: new HttpReportDraftRepository(),
      submissionRepository: new HttpSubmissionRepository(),
      reviewerCommentRepository: new HttpReviewerCommentRepository(),
      reportTeamRepository: new HttpReportTeamRepository(),
    };
    this.store = createStore({ dependencies: this.dependencies });
  }
}

export const app = new App();
