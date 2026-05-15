import { StubClockProvider } from "@modules/core/provider/stub.clock-provider";
import { StubIdProvider } from "@modules/core/provider/stub.id-provider";
import { InMemoryReportDraftRepository } from "@modules/report-draft/core/repository-infra/in-memory.report-draft.repository-infra";
import { InMemoryReviewerCommentRepository } from "@modules/report-draft/core/repository-infra/in-memory.reviewer-comment.repository-infra";
import { InMemorySubmissionRepository } from "@modules/report-draft/core/repository-infra/in-memory.submission.repository-infra";
import { Dependencies } from "@store/dependencies";
import { AppState, createStore } from "@store/redux/store";

/**
 * Build a fully-typed {@link Dependencies} bag with deterministic stubs as
 * defaults. Tests override only the slots they care about — the rest stay
 * cheap and predictable.
 *
 * Defaults:
 * - `idProvider` → `StubIdProvider()` emits `stub-id-1`, `stub-id-2`, …
 * - `clock`      → `StubClockProvider()` emits `2024-01-01T00:00:00.000Z`,
 *                  `2024-01-01T00:00:01.000Z`, … (one second apart)
 * - All repositories → fresh `InMemory*Repository` instances (no shared state
 *                       between tests).
 */
const createDependencies = (overrides?: Partial<Dependencies>): Dependencies => ({
  idProvider: new StubIdProvider(),
  clock: new StubClockProvider(),
  reportDraftRepository: new InMemoryReportDraftRepository(),
  submissionRepository: new InMemorySubmissionRepository(),
  reviewerCommentRepository: new InMemoryReviewerCommentRepository(),
  ...overrides,
});

/**
 * Creates a Redux store wired with default stub dependencies. Tests can
 * preload a partial state and/or override specific dependencies. The store
 * shape exactly matches the production one — only the adapters differ.
 */
export const createTestStore = (config?: {
  initialState?: Partial<AppState>;
  dependencies?: Partial<Dependencies>;
}) => {
  const dependencies = createDependencies(config?.dependencies);

  const seedStore = createStore({ dependencies });
  const initialState: AppState = {
    ...seedStore.getState(),
    ...config?.initialState,
  };

  return createStore({ initialState, dependencies });
};

/**
 * Useful for testing selectors without spinning up a full store.
 */
export const createTestState = (partialState?: Partial<AppState>): AppState => {
  return createTestStore({ initialState: partialState }).getState();
};
