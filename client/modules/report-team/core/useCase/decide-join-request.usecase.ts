import { reportTeamsSlice } from "@modules/report-team/core/store/report-teams.slice";
import { loadCoordinatorTeams } from "@modules/report-team/core/useCase/load-coordinator-teams.usecase";
import type { Dependencies } from "@store/dependencies";
import type { AppDispatch } from "@store/redux/store";

export const decideJoinRequest =
  (input: { requestId: string; decision: "approve" | "reject" }) =>
  async (dispatch: AppDispatch, _getState: unknown, deps: Dependencies): Promise<void> => {
    dispatch(reportTeamsSlice.actions.mutationStarted());
    try {
      if (input.decision === "approve") {
        await deps.reportTeamRepository.approveJoinRequest(input.requestId);
      } else {
        await deps.reportTeamRepository.rejectJoinRequest(input.requestId);
      }
      dispatch(reportTeamsSlice.actions.mutationSucceeded());
      await dispatch(loadCoordinatorTeams());
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      dispatch(reportTeamsSlice.actions.mutationFailed({ message }));
      throw error;
    }
  };
