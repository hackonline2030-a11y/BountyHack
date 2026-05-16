import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  ReportTeam,
  ReportTeamJoinRequest,
} from "@modules/report-team/model/report-team.types";

export type ReportTeamsLoadStatus = "idle" | "loading" | "success" | "error";

export type ReportTeamsState = {
  myTeams: ReportTeam[];
  joinableTeams: ReportTeam[];
  allTeams: ReportTeam[];
  myJoinRequests: ReportTeamJoinRequest[];
  pendingJoinRequests: ReportTeamJoinRequest[];
  loadStatus: ReportTeamsLoadStatus;
  loadError: string | null;
  mutationStatus: ReportTeamsLoadStatus;
  mutationError: string | null;
};

const initialState: ReportTeamsState = {
  myTeams: [],
  joinableTeams: [],
  allTeams: [],
  myJoinRequests: [],
  pendingJoinRequests: [],
  loadStatus: "idle",
  loadError: null,
  mutationStatus: "idle",
  mutationError: null,
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
        pendingJoinRequests?: ReportTeamJoinRequest[];
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
      if (action.payload.pendingJoinRequests !== undefined) {
        state.pendingJoinRequests = action.payload.pendingJoinRequests;
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
  },
});

export const reportTeamsReducer = reportTeamsSlice.reducer;
