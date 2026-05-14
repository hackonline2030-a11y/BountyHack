import type { IClockProvider } from "@modules/core/provider/clock-provider";
import type { IIdProvider } from "@modules/core/provider/id-provider";
import type { IReportDraftsGateway } from "@modules/report-draft/core/gateway/report-drafts.gateway";
import type { IReviewerCommentsGateway } from "@modules/report-draft/core/gateway/reviewer-comments.gateway";
import type { ISubmissionsGateway } from "@modules/report-draft/core/gateway/submissions.gateway";

/**
 * DI bag forwarded to Redux thunks as `extraArgument`. Every outbound
 * port the app talks to should live here; production wires concrete
 * adapters in `App.constructor` (`modules/app/main.ts`), tests inject
 * stubs via `createStore({ dependencies: { ... } })`.
 *
 * Add a new field here whenever you introduce a new gateway/provider —
 * keeping the bag fully typed lets thunks destructure with autocomplete
 * and catches missing wiring at compile time.
 */
export type Dependencies = {
  idProvider: IIdProvider;
  clock: IClockProvider;
  reportDraftsGateway: IReportDraftsGateway;
  submissionsGateway: ISubmissionsGateway;
  reviewerCommentsGateway: IReviewerCommentsGateway;
};
