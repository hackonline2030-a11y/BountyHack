import { SystemClockProvider } from "@modules/core/provider/system.clock-provider";
import { SystemIdProvider } from "@modules/core/provider/system.id-provider";
import { InMemoryReportDraftsGateway } from "@modules/report-draft/core/gateway-infra/in-memory.report-drafts.gateway-infra";
import { InMemoryReviewerCommentsGateway } from "@modules/report-draft/core/gateway-infra/in-memory.reviewer-comments.gateway-infra";
import { InMemorySubmissionsGateway } from "@modules/report-draft/core/gateway-infra/in-memory.submissions.gateway-infra";
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
 * - `reportDraftsGateway`      → in-memory `Map` (no DB yet)
 * - `submissionsGateway`       → in-memory
 * - `reviewerCommentsGateway`  → in-memory
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
      reportDraftsGateway: new InMemoryReportDraftsGateway(),
      submissionsGateway: new InMemorySubmissionsGateway(),
      reviewerCommentsGateway: new InMemoryReviewerCommentsGateway(),
    };
    this.store = createStore({ dependencies: this.dependencies });
  }
}

export const app = new App();
