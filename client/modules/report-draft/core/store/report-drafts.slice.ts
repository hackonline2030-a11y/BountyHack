import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { ReportDraftDomainModel } from "@modules/report-draft/core/model/report-draft.domain-model";

/**
 * State of the **aggregate-level** report-draft store (plural — one per
 * domain entity loaded into memory). This slice is the local mirror of
 * what the three gateways know about; mutations come from thunks that
 * round-trip through them.
 *
 * Separation of concerns:
 * - `reportDraftSlice` (singular, legacy) — wizard UI buffer (current
 *   step, in-flight keystrokes). To be retired once every read path has
 *   migrated to `byId[currentDraftId]`.
 * - `reportDraftsSlice` (this file)        — canonical aggregate state +
 *   submissions + reviewer comments, ready for the review workflow.
 *
 * Storage strategy: flat `byId` maps for drafts / submissions / comments
 * so any thunk can update a single entity in O(1). Ordered lists (e.g.
 * "my drafts latest first") are kept as separate id arrays.
 */
export type ReportDraftsState = {
  byId: Record<string, ReportDraftDomainModel.ReportDraft>;
  submissionsById: Record<string, ReportDraftDomainModel.Submission<unknown>>;
  commentsById: Record<string, ReportDraftDomainModel.ReviewerComment>;

  /** Id of the draft currently being edited by the wizard. */
  currentDraftId: string | null;
  /** Ids returned by the last `listMyDrafts` call, in gateway order. */
  myDraftIds: string[];

  creation: CreationStatus;
  load: OperationStatus;
  list: OperationStatus;
  /** Shared status for every aggregate transition (submit / approve / request / resume / giveUp / reject). */
  transition: OperationStatus;
};

export type CreationStatus =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; draftId: string }
  | { status: "error"; message: string };

export type OperationStatus =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success" }
  | { status: "error"; message: string };

export const reportDraftsInitialState: ReportDraftsState = {
  byId: {},
  submissionsById: {},
  commentsById: {},
  currentDraftId: null,
  myDraftIds: [],
  creation: { status: "idle" },
  load: { status: "idle" },
  list: { status: "idle" },
  transition: { status: "idle" },
};

export const reportDraftsSlice = createSlice({
  name: "reportDrafts",
  initialState: reportDraftsInitialState,
  reducers: {
    // ──────────────────────────────────────────────────────────────────
    // Entity mutations (called by thunks after the gateway has acked)
    // ──────────────────────────────────────────────────────────────────

    /**
     * Insert or replace a draft snapshot. Optimistic-locking is the
     * thunk's responsibility — by the time this reducer runs the gateway
     * has already accepted the write.
     */
    draftUpserted: (
      state,
      action: PayloadAction<ReportDraftDomainModel.ReportDraft>,
    ) => {
      state.byId[action.payload.id] = action.payload;
    },
    /** Insert or replace a submission (covers fresh submit + decision update). */
    submissionUpserted: (
      state,
      action: PayloadAction<ReportDraftDomainModel.Submission<unknown>>,
    ) => {
      state.submissionsById[action.payload.id] = action.payload;
    },
    /** Append (or replace by id) a batch of reviewer comments. */
    commentsUpserted: (
      state,
      action: PayloadAction<ReportDraftDomainModel.ReviewerComment[]>,
    ) => {
      for (const comment of action.payload) {
        state.commentsById[comment.id] = comment;
      }
    },

    setCurrentDraftId: (state, action: PayloadAction<string | null>) => {
      state.currentDraftId = action.payload;
    },

    // ──────────────────────────────────────────────────────────────────
    // createReportDraft (status only — data lands via draftUpserted)
    // ──────────────────────────────────────────────────────────────────

    createReportDraftStarted: (state) => {
      state.creation = { status: "loading" };
    },
    createReportDraftSucceeded: (state, action: PayloadAction<{ draftId: string }>) => {
      state.creation = { status: "success", draftId: action.payload.draftId };
    },
    createReportDraftFailed: (state, action: PayloadAction<{ message: string }>) => {
      state.creation = { status: "error", message: action.payload.message };
    },

    // ──────────────────────────────────────────────────────────────────
    // loadReportDraft
    // ──────────────────────────────────────────────────────────────────

    loadStarted: (state) => {
      state.load = { status: "loading" };
      state.submissionsById = {};
      state.commentsById = {};
    },
    loadSucceeded: (state) => {
      state.load = { status: "success" };
    },
    loadFailed: (state, action: PayloadAction<{ message: string }>) => {
      state.load = { status: "error", message: action.payload.message };
    },

    // ──────────────────────────────────────────────────────────────────
    // listMyDrafts — bulk-upserts drafts and rewrites the ordered index
    // ──────────────────────────────────────────────────────────────────

    listStarted: (state) => {
      state.list = { status: "loading" };
    },
    listSucceeded: (
      state,
      action: PayloadAction<{ drafts: ReportDraftDomainModel.ReportDraft[] }>,
    ) => {
      for (const draft of action.payload.drafts) {
        state.byId[draft.id] = draft;
      }
      state.myDraftIds = action.payload.drafts.map((d) => d.id);
      state.list = { status: "success" };
    },
    listFailed: (state, action: PayloadAction<{ message: string }>) => {
      state.list = { status: "error", message: action.payload.message };
    },

    // ──────────────────────────────────────────────────────────────────
    // Aggregate transitions — single shared status (UI shows one in-flight at a time)
    // ──────────────────────────────────────────────────────────────────

    transitionStarted: (state) => {
      state.transition = { status: "loading" };
    },
    transitionSucceeded: (state) => {
      state.transition = { status: "success" };
    },
    transitionFailed: (state, action: PayloadAction<{ message: string }>) => {
      state.transition = { status: "error", message: action.payload.message };
    },
  },
});

export const reportDraftsReducer = reportDraftsSlice.reducer;
export const reportDraftsActions = reportDraftsSlice.actions;
