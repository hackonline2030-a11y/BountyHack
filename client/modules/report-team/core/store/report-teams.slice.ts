import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { OrphanReportDraft } from "@modules/report-team/model/orphan-report-draft.types";
import type {
  ReportTeam,
  ReportTeamJoinRequest,
  ReportTeamLeaveRequest,
} from "@modules/report-team/model/report-team.types";

export type ReportTeamsLoadStatus = "idle" | "loading" | "success" | "error";

export type ReportTeamsState = {
  myTeams: ReportTeam[];
  joinableTeams: ReportTeam[];
  allTeams: ReportTeam[];
  myJoinRequests: ReportTeamJoinRequest[];
  myLeaveRequests: ReportTeamLeaveRequest[];
  pendingJoinRequests: ReportTeamJoinRequest[];
  pendingLeaveRequests: ReportTeamLeaveRequest[];
  orphanDrafts: OrphanReportDraft[];
  loadStatus: ReportTeamsLoadStatus;
  loadError: string | null;
  mutationStatus: ReportTeamsLoadStatus;
  mutationError: string | null;
  /** Coordinator team detail page (single team by id). */
  teamDetail: ReportTeam | null;
  teamDetailStatus: ReportTeamsLoadStatus;
  teamDetailError: string | null;
};

const initialState: ReportTeamsState = {
  myTeams: [],
  joinableTeams: [],
  allTeams: [],
  myJoinRequests: [],
  myLeaveRequests: [],
  pendingJoinRequests: [],
  pendingLeaveRequests: [],
  orphanDrafts: [],
  loadStatus: "idle",
  loadError: null,
  mutationStatus: "idle",
  mutationError: null,
  teamDetail: null,
  teamDetailStatus: "idle",
  teamDetailError: null,
};

export const reportTeamsSlice = createSlice({
  name: "reportTeams",
  initialState,
  reducers: {
    loadStarted(state) {
      state.loadStatus = "loading";
      state.loadError = null;
    },
    loadSucceeded(
      state,
      action: PayloadAction<{
        myTeams?: ReportTeam[];
        joinableTeams?: ReportTeam[];
        allTeams?: ReportTeam[];
        myJoinRequests?: ReportTeamJoinRequest[];
        myLeaveRequests?: ReportTeamLeaveRequest[];
        pendingJoinRequests?: ReportTeamJoinRequest[];
        pendingLeaveRequests?: ReportTeamLeaveRequest[];
        orphanDrafts?: OrphanReportDraft[];
      }>,
    ) {
      state.loadStatus = "success";
      if (action.payload.myTeams !== undefined) state.myTeams = action.payload.myTeams;
      if (action.payload.joinableTeams !== undefined) {
        state.joinableTeams = action.payload.joinableTeams;
      }
      if (action.payload.allTeams !== undefined) state.allTeams = action.payload.allTeams;
      if (action.payload.myJoinRequests !== undefined) {
        state.myJoinRequests = action.payload.myJoinRequests;
      }
      if (action.payload.myLeaveRequests !== undefined) {
        state.myLeaveRequests = action.payload.myLeaveRequests;
      }
      if (action.payload.pendingJoinRequests !== undefined) {
        state.pendingJoinRequests = action.payload.pendingJoinRequests;
      }
      if (action.payload.pendingLeaveRequests !== undefined) {
        state.pendingLeaveRequests = action.payload.pendingLeaveRequests;
      }
      if (action.payload.orphanDrafts !== undefined) {
        state.orphanDrafts = action.payload.orphanDrafts;
      }
    },
    loadFailed(state, action: PayloadAction<{ message: string }>) {
      state.loadStatus = "error";
      state.loadError = action.payload.message;
    },
    mutationStarted(state) {
      state.mutationStatus = "loading";
      state.mutationError = null;
    },
    mutationSucceeded(state) {
      state.mutationStatus = "success";
    },
    mutationFailed(state, action: PayloadAction<{ message: string }>) {
      state.mutationStatus = "error";
      state.mutationError = action.payload.message;
    },
    teamsReplaced(state, action: PayloadAction<ReportTeam[]>) {
      state.allTeams = action.payload;
    },
    myTeamsReplaced(state, action: PayloadAction<ReportTeam[]>) {
      state.myTeams = action.payload;
    },
    myJoinRequestsReplaced(state, action: PayloadAction<ReportTeamJoinRequest[]>) {
      state.myJoinRequests = action.payload;
    },
    pendingJoinRequestsReplaced(
      state,
      action: PayloadAction<ReportTeamJoinRequest[]>,
    ) {
      state.pendingJoinRequests = action.payload;
    },
    myLeaveRequestsReplaced(state, action: PayloadAction<ReportTeamLeaveRequest[]>) {
      state.myLeaveRequests = action.payload;
    },
    pendingLeaveRequestsReplaced(
      state,
      action: PayloadAction<ReportTeamLeaveRequest[]>,
    ) {
      state.pendingLeaveRequests = action.payload;
    },
    teamDetailReset(state) {
      state.teamDetail = null;
      state.teamDetailStatus = "idle";
      state.teamDetailError = null;
    },
    teamDetailLoadStarted(state) {
      state.teamDetailStatus = "loading";
      state.teamDetailError = null;
    },
    teamDetailLoadSucceeded(state, action: PayloadAction<ReportTeam>) {
      state.teamDetailStatus = "success";
      state.teamDetail = action.payload;
    },
    teamDetailLoadFailed(state, action: PayloadAction<{ message: string }>) {
      state.teamDetailStatus = "error";
      state.teamDetailError = action.payload.message;
      state.teamDetail = null;
    },
  },
});

export const reportTeamsReducer = reportTeamsSlice.reducer;
